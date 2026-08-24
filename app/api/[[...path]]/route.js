import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'
import { BRANDS, CATEGORIES, PRODUCTS, SEED_VERSION } from '@/lib/data/seed'

let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

async function ensureSeeded(db) {
  const metaCol = db.collection('meta')
  const meta = await metaCol.findOne({ key: 'seed' })
  const currentVersion = meta?.version || 0
  if (currentVersion === SEED_VERSION) return
  // Version changed — wipe & reseed
  await Promise.all([
    db.collection('brands').deleteMany({}),
    db.collection('categories').deleteMany({}),
    db.collection('products').deleteMany({}),
  ])
  await Promise.all([
    db.collection('brands').insertMany(BRANDS.map(b => ({ ...b }))),
    db.collection('categories').insertMany(CATEGORIES.map(c => ({ ...c }))),
    db.collection('products').insertMany(PRODUCTS.map(p => ({ ...p }))),
  ])
  await metaCol.updateOne({ key: 'seed' }, { $set: { key: 'seed', version: SEED_VERSION, updatedAt: new Date() } }, { upsert: true })
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

const clean = (doc) => { if (!doc) return doc; const { _id, ...rest } = doc; return rest }

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()
    await ensureSeeded(db)

    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ ok: true, service: 'GlobalSSLWeb API' }))
    }

    if (route === '/brands' && method === 'GET') {
      const brands = await db.collection('brands').find({}).toArray()
      return handleCORS(NextResponse.json(brands.map(clean)))
    }

    if (route === '/categories' && method === 'GET') {
      const cats = await db.collection('categories').find({}).toArray()
      return handleCORS(NextResponse.json(cats.map(clean)))
    }

    if (route === '/products' && method === 'GET') {
      const url = new URL(request.url)
      const sp = url.searchParams
      const query = { active: true }
      const brand = sp.get('brand'); if (brand) query.brandSlug = brand
      const validation = sp.get('validation'); if (validation) query.validation = validation
      const category = sp.get('category'); if (category) query.categorySlug = category
      if (sp.get('wildcard') === 'true') query.wildcard = true
      if (sp.get('multiDomain') === 'true') query.multiDomain = true
      if (sp.get('featured') === 'true') query.featured = true
      const search = sp.get('search')
      if (search) {
        const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        query.$or = [{ name: rx }, { description: rx }, { brandName: rx }, { validation: rx }]
      }
      const minPrice = parseFloat(sp.get('minPrice')); const maxPrice = parseFloat(sp.get('maxPrice'))
      if (!isNaN(minPrice) || !isNaN(maxPrice)) {
        query.price = {}
        if (!isNaN(minPrice)) query.price.$gte = minPrice
        if (!isNaN(maxPrice)) query.price.$lte = maxPrice
      }
      const sort = sp.get('sort') || 'featured'
      const sortMap = {
        featured: { featured: -1, price: 1 },
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        newest: { createdAt: -1 },
        name: { name: 1 },
      }
      const limit = Math.min(parseInt(sp.get('limit') || '24'), 100)
      const page = Math.max(parseInt(sp.get('page') || '1'), 1)
      const cursor = db.collection('products').find(query).sort(sortMap[sort] || sortMap.featured).skip((page - 1) * limit).limit(limit)
      const [items, total] = await Promise.all([cursor.toArray(), db.collection('products').countDocuments(query)])
      return handleCORS(NextResponse.json({ items: items.map(clean), total, page, limit, totalPages: Math.ceil(total / limit) }))
    }

    // Product by slug: /products/slug/:slug
    if (path[0] === 'products' && path[1] === 'slug' && path[2] && method === 'GET') {
      const slug = path[2]
      const product = await db.collection('products').findOne({ slug, active: true })
      if (!product) return handleCORS(NextResponse.json({ error: 'Product not found' }, { status: 404 }))
      const brand = await db.collection('brands').findOne({ slug: product.brandSlug })
      const related = await db.collection('products').find({ categorySlug: product.categorySlug, slug: { $ne: slug }, active: true }).limit(4).toArray()
      return handleCORS(NextResponse.json({ product: clean(product), brand: clean(brand), related: related.map(clean) }))
    }

    // POST /cart/validate — server always recomputes totals from DB
    if (route === '/cart/validate' && method === 'POST') {
      const body = await request.json()
      const ids = (body.items || []).map(i => i.id)
      if (!ids.length) return handleCORS(NextResponse.json({ items: [], subtotal: 0, tax: 0, total: 0 }))
      const products = await db.collection('products').find({ id: { $in: ids }, active: true }).toArray()
      const map = new Map(products.map(p => [p.id, p]))
      const items = (body.items || []).map(i => {
        const p = map.get(i.id)
        if (!p) return { id: i.id, valid: false, message: 'Product no longer available' }
        const qty = Math.max(parseInt(i.qty) || 1, 1)
        return { id: p.id, slug: p.slug, name: p.name, brandName: p.brandName, validation: p.validation, price: p.price, originalPrice: p.originalPrice, qty, lineTotal: p.price * qty, valid: true }
      })
      const validItems = items.filter(i => i.valid)
      const subtotal = validItems.reduce((s, i) => s + i.lineTotal, 0)
      const tax = Math.round(subtotal * 0.18 * 100) / 100
      const total = Math.round((subtotal + tax) * 100) / 100
      return handleCORS(NextResponse.json({ items, subtotal, tax, total, currency: 'INR' }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
