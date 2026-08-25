import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'
import { BRANDS, CATEGORIES, PRODUCTS, SEED_VERSION } from '@/lib/data/seed'
import { computePrices } from '@/lib/admin/pricing'
import { verifyAdminRequest, setAdminCookie, clearAdminCookie, expectedToken } from '@/lib/admin/auth'
import { hashPassword, verifyPassword, verifyUserRequest, setUserCookie, clearUserCookie, signUserToken } from '@/lib/auth/user'
import { sendEmail, tplOrderPlaced, tplPaymentConfirmed, tplDcvInstructions, tplCertificateIssued, tplWelcome, tplPasswordReset, tplAdminSetPassword } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

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

    // POST /admin/products  (create new product)
    if (route === '/admin/products' && method === 'POST') {
      if (!verifyAdminRequest(request)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      }
      const body = await request.json().catch(() => ({}))
      const required = ['name','brandSlug','categorySlug','validation']
      for (const k of required) {
        if (!body[k]) return handleCORS(NextResponse.json({ error: `${k} is required` }, { status: 400 }))
      }
      // Auto-slug
      const baseSlug = (body.slug || body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      let slug = baseSlug
      let n = 1
      while (await db.collection('products').findOne({ slug })) { n++; slug = `${baseSlug}-${n}` }

      const brand = await db.collection('brands').findOne({ slug: body.brandSlug })
      if (!brand) return handleCORS(NextResponse.json({ error: 'Invalid brand' }, { status: 400 }))

      const wholesalePriceUsd = Number(body.wholesalePriceUsd) || 0
      const msrpUsd = Number(body.msrpUsd) || 0
      const markup = Number(body.markup) || 1.7
      const priceOverride = body.priceOverride == null || body.priceOverride === '' ? null : Number(body.priceOverride)
      const usdToInr = Number(body.usdToInr) || 85
      const { price, originalPrice } = computePrices({ wholesalePriceUsd, msrpUsd, markup, priceOverride, usdToInr })

      const now = new Date()
      const id = 'p-' + Math.random().toString(36).slice(2, 10)
      const product = {
        id, slug, name: body.name, brandSlug: brand.slug, brandName: brand.name,
        categorySlug: body.categorySlug, validation: body.validation,
        wildcard: !!body.wildcard, multiDomain: !!body.multiDomain,
        featured: !!body.featured, active: body.active !== false,
        wholesalePriceUsd, msrpUsd, markup, priceOverride, usdToInr,
        price, originalPrice, currency: 'INR',
        warranty: body.warranty || '', issuance: body.issuance || '5 minutes', encryption: body.encryption || '256-bit',
        shortDescription: body.shortDescription || '',
        description: body.description || '',
        features: Array.isArray(body.features) ? body.features : String(body.features || '').split(/\n|,/).map(s => s.trim()).filter(Boolean),
        browsers: Array.isArray(body.browsers) ? body.browsers : String(body.browsers || 'Chrome,Firefox,Safari,Edge,iOS,Android').split(/\n|,/).map(s => s.trim()).filter(Boolean),
        createdAt: now, updatedAt: now,
      }
      await db.collection('products').insertOne({ ...product })
      return handleCORS(NextResponse.json(product))
    }

    // ============ ORDERS ============
    // POST /orders  (create order from cart)
    if (route === '/orders' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const { customer = {}, billing = {}, items = [], gst = {} } = body
      if (!customer.email || !customer.name) {
        return handleCORS(NextResponse.json({ error: 'Customer name and email required' }, { status: 400 }))
      }
      if (!items?.length) return handleCORS(NextResponse.json({ error: 'Cart is empty' }, { status: 400 }))

      const ids = items.map(i => i.id)
      const products = await db.collection('products').find({ id: { $in: ids }, active: true }).toArray()
      const map = new Map(products.map(p => [p.id, p]))
      const lineItems = []
      for (const i of items) {
        const p = map.get(i.id)
        if (!p) continue
        const qty = Math.max(parseInt(i.qty) || 1, 1)
        lineItems.push({
          productId: p.id, slug: p.slug, name: p.name, brandName: p.brandName, brandSlug: p.brandSlug,
          validation: p.validation, wildcard: !!p.wildcard, multiDomain: !!p.multiDomain,
          price: p.price, originalPrice: p.originalPrice, qty, lineTotal: p.price * qty,
          warranty: p.warranty, issuance: p.issuance, encryption: p.encryption,
          fulfillment: { status: 'AWAITING_CSR', csr: null, csrSubmittedAt: null,
            dcvMethod: null, dcvSubmittedInfo: null,
            dcvInstructions: null, dcvInstructionsAt: null,
            dcvCompletedAt: null,
            certificate: null, chain: null, issuedAt: null, expiresAt: null,
            adminNote: null,
          },
        })
      }
      if (!lineItems.length) return handleCORS(NextResponse.json({ error: 'No valid products in cart' }, { status: 400 }))

      const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0)
      const tax = Math.round(subtotal * 0.18)
      const total = subtotal + tax
      const now = new Date()
      const orderNumber = `GSSL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

      const order = {
        id: 'o-' + Math.random().toString(36).slice(2, 12),
        orderNumber,
        customer: { name: customer.name, email: customer.email, phone: customer.phone || '', company: customer.company || '' },
        billing: {
          address: billing.address || '', city: billing.city || '', state: billing.state || '',
          postalCode: billing.postalCode || '', country: billing.country || 'India',
        },
        gst: { gstNumber: gst.gstNumber || '', companyName: gst.companyName || '' },
        items: lineItems, subtotal, tax, total, currency: 'INR',
        status: 'CREATED', paymentStatus: 'PENDING', paymentMethod: body.paymentMethod || 'manual',
        adminNotes: '', createdAt: now, updatedAt: now,
      }
      await db.collection('orders').insertOne({ ...order })
      // Retro-link to user account if one exists with matching email
      const linkedUser = await db.collection('users').findOne({ email: customer.email.toLowerCase() })
      if (linkedUser) await db.collection('orders').updateOne({ id: order.id }, { $set: { userId: linkedUser.id } })
      // Fire order-placed email (non-blocking best-effort)
      sendEmail({ to: order.customer.email, ...tplOrderPlaced(order) }).catch(() => {})
      return handleCORS(NextResponse.json({ ok: true, orderNumber, id: order.id }))
    }

    // GET /orders/:orderNumber  (customer tracking)
    if (path[0] === 'orders' && path[1] && !path[2] && method === 'GET') {
      const order = await db.collection('orders').findOne({ orderNumber: path[1] })
      if (!order) return handleCORS(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
      return handleCORS(NextResponse.json(clean(order)))
    }

    // POST /orders/:orderNumber/csr  { itemIndex, csr, dcvMethod, dcvSubmittedInfo, email }
    if (path[0] === 'orders' && path[1] && path[2] === 'csr' && method === 'POST') {
      const orderNumber = path[1]
      const body = await request.json().catch(() => ({}))
      const order = await db.collection('orders').findOne({ orderNumber })
      if (!order) return handleCORS(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
      // Simple owner check
      if ((body.email || '').toLowerCase() !== (order.customer.email || '').toLowerCase()) {
        return handleCORS(NextResponse.json({ error: 'Email does not match order' }, { status: 403 }))
      }
      const idx = Number(body.itemIndex)
      const item = order.items[idx]
      if (!item) return handleCORS(NextResponse.json({ error: 'Invalid item' }, { status: 400 }))
      if (!body.csr || !body.csr.includes('BEGIN CERTIFICATE REQUEST')) {
        return handleCORS(NextResponse.json({ error: 'Please paste a valid CSR (PEM format)' }, { status: 400 }))
      }
      if (!['email','dns','http'].includes(body.dcvMethod)) {
        return handleCORS(NextResponse.json({ error: 'Choose a DCV method' }, { status: 400 }))
      }
      const now = new Date()
      const setPath = `items.${idx}.fulfillment`
      await db.collection('orders').updateOne(
        { orderNumber },
        {
          $set: {
            [`${setPath}.csr`]: body.csr.trim(),
            [`${setPath}.dcvMethod`]: body.dcvMethod,
            [`${setPath}.dcvSubmittedInfo`]: body.dcvSubmittedInfo || '',
            [`${setPath}.csrSubmittedAt`]: now,
            [`${setPath}.status`]: 'CSR_SUBMITTED',
            status: order.status === 'PAID' || order.status === 'CREATED' ? 'CSR_SUBMITTED' : order.status,
            updatedAt: now,
          }
        }
      )
      const updated = await db.collection('orders').findOne({ orderNumber })
      return handleCORS(NextResponse.json(clean(updated)))
    }

    // POST /orders/:orderNumber/dcv-completed  { itemIndex, email }
    if (path[0] === 'orders' && path[1] && path[2] === 'dcv-completed' && method === 'POST') {
      const orderNumber = path[1]
      const body = await request.json().catch(() => ({}))
      const order = await db.collection('orders').findOne({ orderNumber })
      if (!order) return handleCORS(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
      if ((body.email || '').toLowerCase() !== (order.customer.email || '').toLowerCase()) {
        return handleCORS(NextResponse.json({ error: 'Email does not match' }, { status: 403 }))
      }
      const idx = Number(body.itemIndex)
      const item = order.items[idx]
      if (!item) return handleCORS(NextResponse.json({ error: 'Invalid item' }, { status: 400 }))
      const now = new Date()
      await db.collection('orders').updateOne(
        { orderNumber },
        { $set: { [`items.${idx}.fulfillment.dcvCompletedAt`]: now, [`items.${idx}.fulfillment.status`]: 'DCV_COMPLETED', status: 'DCV_COMPLETED', updatedAt: now } }
      )
      const updated = await db.collection('orders').findOne({ orderNumber })
      return handleCORS(NextResponse.json(clean(updated)))
    }

    // ============ ADMIN ORDER ENDPOINTS ============
    // GET /admin/orders
    if (route === '/admin/orders' && method === 'GET') {
      if (!verifyAdminRequest(request)) return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      const url = new URL(request.url)
      const status = url.searchParams.get('status')
      const q = {}
      if (status) q.status = status
      const orders = await db.collection('orders').find(q).sort({ createdAt: -1 }).limit(200).toArray()
      return handleCORS(NextResponse.json({ items: orders.map(clean), total: orders.length }))
    }

    // GET /admin/orders/:orderNumber
    if (path[0] === 'admin' && path[1] === 'orders' && path[2] && method === 'GET') {
      if (!verifyAdminRequest(request)) return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      const order = await db.collection('orders').findOne({ orderNumber: path[2] })
      if (!order) return handleCORS(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
      return handleCORS(NextResponse.json(clean(order)))
    }

    // PATCH /admin/orders/:orderNumber   { status?, paymentStatus?, adminNotes? }
    if (path[0] === 'admin' && path[1] === 'orders' && path[2] && !path[3] && method === 'PATCH') {
      if (!verifyAdminRequest(request)) return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const update = { updatedAt: new Date() }
      const allowedStatus = ['CREATED','PAID','CSR_SUBMITTED','DCV_INSTRUCTIONS','DCV_COMPLETED','ISSUED','CANCELLED']
      if (body.status && allowedStatus.includes(body.status)) update.status = body.status
      if (body.paymentStatus && ['PENDING','PAID','REFUNDED','FAILED'].includes(body.paymentStatus)) update.paymentStatus = body.paymentStatus
      if (typeof body.adminNotes === 'string') update.adminNotes = body.adminNotes
      const before = await db.collection('orders').findOne({ orderNumber: path[2] })
      await db.collection('orders').updateOne({ orderNumber: path[2] }, { $set: update })
      const updated = await db.collection('orders').findOne({ orderNumber: path[2] })
      // Fire payment-confirmed email on PENDING → PAID transition
      if (updated && before?.paymentStatus !== 'PAID' && updated.paymentStatus === 'PAID') {
        sendEmail({ to: updated.customer.email, ...tplPaymentConfirmed(updated) }).catch(() => {})
      }
      return handleCORS(NextResponse.json(clean(updated)))
    }

    // PATCH /admin/orders/:orderNumber/items/:idx/dcv  { dcvInstructions }
    if (path[0] === 'admin' && path[1] === 'orders' && path[2] && path[3] === 'items' && path[4] != null && path[5] === 'dcv' && method === 'PATCH') {
      if (!verifyAdminRequest(request)) return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const idx = Number(path[4])
      const order = await db.collection('orders').findOne({ orderNumber: path[2] })
      if (!order || !order.items[idx]) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const now = new Date()
      await db.collection('orders').updateOne(
        { orderNumber: path[2] },
        { $set: {
          [`items.${idx}.fulfillment.dcvInstructions`]: body.dcvInstructions || '',
          [`items.${idx}.fulfillment.dcvInstructionsAt`]: now,
          [`items.${idx}.fulfillment.status`]: 'DCV_INSTRUCTIONS',
          status: 'DCV_INSTRUCTIONS',
          updatedAt: now,
        } }
      )
      const updated = await db.collection('orders').findOne({ orderNumber: path[2] })
      // Notify customer of DCV instructions
      const idxNum = Number(path[4])
      sendEmail({ to: updated.customer.email, ...tplDcvInstructions(updated, updated.items[idxNum], idxNum) }).catch(() => {})
      return handleCORS(NextResponse.json(clean(updated)))
    }

    // PATCH /admin/orders/:orderNumber/items/:idx/certificate  { certificate, chain, expiresAt }
    if (path[0] === 'admin' && path[1] === 'orders' && path[2] && path[3] === 'items' && path[4] != null && path[5] === 'certificate' && method === 'PATCH') {
      if (!verifyAdminRequest(request)) return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const idx = Number(path[4])
      if (!body.certificate || !String(body.certificate).includes('BEGIN CERTIFICATE')) {
        return handleCORS(NextResponse.json({ error: 'Certificate PEM required' }, { status: 400 }))
      }
      const now = new Date()
      await db.collection('orders').updateOne(
        { orderNumber: path[2] },
        { $set: {
          [`items.${idx}.fulfillment.certificate`]: String(body.certificate).trim(),
          [`items.${idx}.fulfillment.chain`]: body.chain ? String(body.chain).trim() : null,
          [`items.${idx}.fulfillment.expiresAt`]: body.expiresAt ? new Date(body.expiresAt) : null,
          [`items.${idx}.fulfillment.issuedAt`]: now,
          [`items.${idx}.fulfillment.status`]: 'ISSUED',
          status: 'ISSUED',
          updatedAt: now,
        } }
      )
      const updated = await db.collection('orders').findOne({ orderNumber: path[2] })
      // Notify customer certificate is ready
      sendEmail({ to: updated.customer.email, ...tplCertificateIssued(updated, updated.items[idx], idx) }).catch(() => {})
      return handleCORS(NextResponse.json(clean(updated)))
    }

    // GET /orders/:orderNumber/items/:idx/download?kind=cert|chain|bundle&email=X
    if (path[0] === 'orders' && path[1] && path[2] === 'items' && path[3] != null && path[4] === 'download' && method === 'GET') {
      const url = new URL(request.url)
      const email = (url.searchParams.get('email') || '').toLowerCase()
      const kind = url.searchParams.get('kind') || 'bundle'
      const order = await db.collection('orders').findOne({ orderNumber: path[1] })
      if (!order) return handleCORS(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
      if (email !== (order.customer.email || '').toLowerCase()) {
        return handleCORS(NextResponse.json({ error: 'Email does not match order' }, { status: 403 }))
      }
      const item = order.items[Number(path[3])]
      const f = item?.fulfillment
      if (!f?.certificate) return handleCORS(NextResponse.json({ error: 'Certificate not issued yet' }, { status: 404 }))
      let content = ''
      let filename = `${order.orderNumber}-${item.slug}.crt`
      if (kind === 'chain') { content = f.chain || ''; filename = `${order.orderNumber}-${item.slug}-chain.crt` }
      else if (kind === 'bundle') { content = [f.certificate, f.chain].filter(Boolean).join('\n'); filename = `${order.orderNumber}-${item.slug}-bundle.crt` }
      else content = f.certificate
      return new Response(content, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-pem-file',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        },
      })
    }

    // =============== USER AUTH ===============
    // POST /auth/register  { name, email, password, phone?, company? }
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').toLowerCase().trim()
      if (!body.name || !email || !body.password) return handleCORS(NextResponse.json({ error: 'Name, email and password required' }, { status: 400 }))
      if (String(body.password).length < 6) return handleCORS(NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 }))
      const existing = await db.collection('users').findOne({ email })
      if (existing) return handleCORS(NextResponse.json({ error: 'Email already registered — try signing in' }, { status: 409 }))
      const now = new Date()
      const user = {
        id: 'u-' + uuidv4(), email, name: String(body.name).trim(),
        phone: body.phone || '', company: body.company || '',
        passwordHash: await hashPassword(body.password),
        role: 'user', status: 'active', createdAt: now, updatedAt: now,
      }
      await db.collection('users').insertOne({ ...user })
      // Retro-link any existing guest orders by email
      await db.collection('orders').updateMany({ 'customer.email': email, userId: { $exists: false } }, { $set: { userId: user.id } })
      sendEmail({ to: email, ...tplWelcome(user) }).catch(() => {})
      const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } })
      setUserCookie(res, user)
      return handleCORS(res)
    }

    // POST /auth/login  { email, password }
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').toLowerCase().trim()
      const user = await db.collection('users').findOne({ email })
      if (!user || !(await verifyPassword(body.password || '', user.passwordHash))) {
        return handleCORS(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
      }
      if (user.status === 'disabled') return handleCORS(NextResponse.json({ error: 'Account disabled — contact support' }, { status: 403 }))
      const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } })
      setUserCookie(res, user)
      return handleCORS(res)
    }

    // POST /auth/logout
    if (route === '/auth/logout' && method === 'POST') {
      const res = NextResponse.json({ ok: true })
      clearUserCookie(res)
      return handleCORS(res)
    }

    // GET /auth/me
    if (route === '/auth/me' && method === 'GET') {
      const claims = verifyUserRequest(request)
      if (!claims) return handleCORS(NextResponse.json({ user: null }))
      const user = await db.collection('users').findOne({ id: claims.sub })
      if (!user) return handleCORS(NextResponse.json({ user: null }))
      return handleCORS(NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, phone: user.phone, company: user.company } }))
    }

    // POST /auth/forgot-password  { email }
    if (route === '/auth/forgot-password' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').toLowerCase().trim()
      const user = await db.collection('users').findOne({ email })
      // Always return ok to prevent enumeration
      if (user) {
        const token = uuidv4().replace(/-/g, '')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
        await db.collection('password_resets').insertOne({ token, userId: user.id, email, expiresAt, used: false, createdAt: new Date() })
        sendEmail({ to: email, ...tplPasswordReset(email, token) }).catch(() => {})
      }
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // POST /auth/reset-password  { token, password }
    if (route === '/auth/reset-password' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      if (!body.token || !body.password || String(body.password).length < 6) return handleCORS(NextResponse.json({ error: 'Invalid reset request' }, { status: 400 }))
      const rec = await db.collection('password_resets').findOne({ token: body.token, used: false })
      if (!rec) return handleCORS(NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 }))
      if (new Date(rec.expiresAt) < new Date()) return handleCORS(NextResponse.json({ error: 'Reset link expired' }, { status: 400 }))
      const passwordHash = await hashPassword(body.password)
      await db.collection('users').updateOne({ id: rec.userId }, { $set: { passwordHash, updatedAt: new Date() } })
      await db.collection('password_resets').updateOne({ token: body.token }, { $set: { used: true } })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // GET /account/orders — signed-in user's orders
    if (route === '/account/orders' && method === 'GET') {
      const claims = verifyUserRequest(request)
      if (!claims) return handleCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const orders = await db.collection('orders').find({
        $or: [{ userId: claims.sub }, { 'customer.email': claims.email }]
      }).sort({ createdAt: -1 }).limit(100).toArray()
      return handleCORS(NextResponse.json({ items: orders.map(clean), total: orders.length }))
    }

    // PATCH /account  { name?, phone?, company?, currentPassword?, newPassword? }
    if (route === '/account' && method === 'PATCH') {
      const claims = verifyUserRequest(request)
      if (!claims) return handleCORS(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
      const body = await request.json().catch(() => ({}))
      const user = await db.collection('users').findOne({ id: claims.sub })
      if (!user) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const update = { updatedAt: new Date() }
      if (typeof body.name === 'string') update.name = body.name
      if (typeof body.phone === 'string') update.phone = body.phone
      if (typeof body.company === 'string') update.company = body.company
      if (body.newPassword) {
        if (!body.currentPassword || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
          return handleCORS(NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 }))
        }
        if (String(body.newPassword).length < 6) return handleCORS(NextResponse.json({ error: 'New password too short' }, { status: 400 }))
        update.passwordHash = await hashPassword(body.newPassword)
      }
      await db.collection('users').updateOne({ id: user.id }, { $set: update })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // =============== ADMIN USERS ===============
    // GET /admin/users
    if (route === '/admin/users' && method === 'GET') {
      if (!verifyAdminRequest(request)) return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      const users = await db.collection('users').find({}).sort({ createdAt: -1 }).limit(500).toArray()
      // Attach order count / spend
      const uids = users.map(u => u.id)
      const orderAgg = uids.length ? await db.collection('orders').aggregate([
        { $match: { userId: { $in: uids } } },
        { $group: { _id: '$userId', orders: { $sum: 1 }, spend: { $sum: '$total' } } },
      ]).toArray() : []
      const agg = Object.fromEntries(orderAgg.map(o => [o._id, o]))
      const list = users.map(u => { const { passwordHash, _id, ...rest } = u; return { ...rest, orderCount: agg[u.id]?.orders || 0, totalSpend: agg[u.id]?.spend || 0 } })
      return handleCORS(NextResponse.json({ items: list, total: list.length }))
    }

    // PATCH /admin/users/:id  { name?, email?, phone?, company?, status? }
    if (path[0] === 'admin' && path[1] === 'users' && path[2] && !path[3] && method === 'PATCH') {
      if (!verifyAdminRequest(request)) return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      const id = path[2]
      const body = await request.json().catch(() => ({}))
      const user = await db.collection('users').findOne({ id })
      if (!user) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const update = { updatedAt: new Date() }
      if (typeof body.name === 'string') update.name = body.name
      if (typeof body.phone === 'string') update.phone = body.phone
      if (typeof body.company === 'string') update.company = body.company
      if (body.status && ['active','disabled'].includes(body.status)) update.status = body.status
      if (body.email && String(body.email).toLowerCase() !== user.email) {
        const newEmail = String(body.email).toLowerCase().trim()
        const dup = await db.collection('users').findOne({ email: newEmail })
        if (dup) return handleCORS(NextResponse.json({ error: 'Email already in use' }, { status: 409 }))
        update.email = newEmail
        // Also update orders customer.email? Leave order emails intact for history integrity.
      }
      await db.collection('users').updateOne({ id }, { $set: update })
      const updated = await db.collection('users').findOne({ id })
      const { passwordHash, _id, ...rest } = updated
      return handleCORS(NextResponse.json(rest))
    }

    // POST /admin/users/:id/reset-password — generates temp password + emails user
    if (path[0] === 'admin' && path[1] === 'users' && path[2] && path[3] === 'reset-password' && method === 'POST') {
      if (!verifyAdminRequest(request)) return handleCORS(NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
      const user = await db.collection('users').findOne({ id: path[2] })
      if (!user) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const tempPassword = crypto.randomBytes(6).toString('base64').replace(/[+/=]/g, '').slice(0, 10) + '!A1'
      const passwordHash = await hashPassword(tempPassword)
      await db.collection('users').updateOne({ id: user.id }, { $set: { passwordHash, updatedAt: new Date() } })
      sendEmail({ to: user.email, ...tplAdminSetPassword(user, tempPassword) }).catch(() => {})
      return handleCORS(NextResponse.json({ ok: true, tempPassword }))
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
