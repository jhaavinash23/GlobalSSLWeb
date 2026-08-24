import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'
import { BRANDS, CATEGORIES, PRODUCTS, SEED_VERSION } from '@/lib/data/seed'
import { computePrices } from '@/lib/admin/pricing'
import { verifyAdminRequest, setAdminCookie, clearAdminCookie, expectedToken } from '@/lib/admin/auth'

let client
let db
let connectPromise

async function connectToMongo() {
  if (db) return db
  if (!connectPromise) {
    connectPromise = (async () => {
      client = new MongoClient(process.env.MONGO_URL)
      await client.connect()
      db = client.db(process.env.DB_NAME)
      return db
    })()
  }
  return connectPromise
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

    // =============== ADMIN ENDPOINTS ===============

    // POST /admin/login  { password }
    if (route === '/admin/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const expected = process.env.ADMIN_PASSWORD
      if (!expected) {
        return handleCORS(NextResponse.json({ error: 'ADMIN_PASSWORD not configured on server' }, { status: 500 }))
      }
      if (body?.password !== expected) {
        return handleCORS(NextResponse.json({ error: 'Invalid password' }, { status: 401 }))
      }
      const res = NextResponse.json({ ok: true })
      setAdminCookie(res)
      return handleCORS(res)
    }

    // POST /admin/logout
    if (route === '/admin/logout' && method === 'POST') {
      // Support HTML form POST — redirect back to login on completion
      const accept = request.headers.get('accept') || ''
      const wantsHtml = accept.includes('text/html')
      const res = wantsHtml
        ? NextResponse.redirect(new URL('/admin/login', request.url))
        : NextResponse.json({ ok: true })
      clearAdminCookie(res)
      return handleCORS(res)
    }

    // GET /admin/products  (all products, including inactive, no filtering)
    if (route === '/admin/products' && method === 'GET') {
      if (!verifyAdminRequest(request)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      }
      const items = await db.collection('products').find({}).sort({ brandSlug: 1, name: 1 }).toArray()
      return handleCORS(NextResponse.json({ items: items.map(clean), total: items.length }))
    }

    // PATCH /admin/products/:id
    if (path[0] === 'admin' && path[1] === 'products' && path[2] && path[2] !== 'bulk-markup' && method === 'PATCH') {
      if (!verifyAdminRequest(request)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      }
      const id = path[2]
      const patch = await request.json().catch(() => ({}))
      const existing = await db.collection('products').findOne({ id })
      if (!existing) return handleCORS(NextResponse.json({ error: 'Product not found' }, { status: 404 }))

      // Whitelisted editable fields
      const allowed = ['name','shortDescription','description','warranty','issuance','encryption','featured','active','wildcard','multiDomain','wholesalePriceUsd','msrpUsd','markup','priceOverride','usdToInr']
      const update = {}
      for (const k of allowed) {
        if (k in patch) update[k] = patch[k]
      }
      // Coerce numerics
      for (const k of ['wholesalePriceUsd','msrpUsd','markup','usdToInr']) {
        if (k in update) update[k] = update[k] == null ? null : Number(update[k])
      }
      if ('priceOverride' in update) {
        update.priceOverride = update.priceOverride == null || update.priceOverride === '' ? null : Number(update.priceOverride)
      }
      // Coerce booleans
      for (const k of ['featured','active','wildcard','multiDomain']) {
        if (k in update) update[k] = !!update[k]
      }

      // Recompute derived price + originalPrice
      const merged = { ...existing, ...update }
      const { price, originalPrice } = computePrices({
        wholesalePriceUsd: merged.wholesalePriceUsd,
        msrpUsd: merged.msrpUsd,
        markup: merged.markup,
        priceOverride: merged.priceOverride,
        usdToInr: merged.usdToInr || 85,
      })
      update.price = price
      update.originalPrice = originalPrice
      update.updatedAt = new Date()

      await db.collection('products').updateOne({ id }, { $set: update })
      const updated = await db.collection('products').findOne({ id })
      return handleCORS(NextResponse.json(clean(updated)))
    }

    // POST /admin/products/bulk-markup  { markup, brandSlug?, categorySlug?, validation? }
    if (route === '/admin/products/bulk-markup' && method === 'POST') {
      if (!verifyAdminRequest(request)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      }
      const body = await request.json().catch(() => ({}))
      const markup = Number(body.markup)
      if (!markup || markup < 1.01) return handleCORS(NextResponse.json({ error: 'Invalid markup' }, { status: 400 }))
      const query = {}
      if (body.brandSlug) query.brandSlug = body.brandSlug
      if (body.categorySlug) query.categorySlug = body.categorySlug
      if (body.validation) query.validation = body.validation

      const products = await db.collection('products').find(query).toArray()
      let updated = 0
      for (const p of products) {
        // Skip products with a manual override — don't overwrite operator intent
        if (p.priceOverride && Number(p.priceOverride) > 0) continue
        const rate = p.usdToInr || 85
        const { price, originalPrice } = computePrices({
          wholesalePriceUsd: p.wholesalePriceUsd,
          msrpUsd: p.msrpUsd,
          markup,
          priceOverride: null,
          usdToInr: rate,
        })
        await db.collection('products').updateOne({ id: p.id }, { $set: { markup, price, originalPrice, updatedAt: new Date() } })
        updated++
      }
      return handleCORS(NextResponse.json({ ok: true, updated, matched: products.length }))
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
