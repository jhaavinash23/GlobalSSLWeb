'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ShieldCheck, Zap, Award, Globe, Check, ChevronRight, Lock, Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart'
import { formatINR, pct } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import ProductCard from '@/components/site/product-card'

const valColor = (v) => ({DV:'bg-blue-50 text-blue-700 border-blue-100',OV:'bg-emerald-50 text-emerald-700 border-emerald-100',EV:'bg-amber-50 text-amber-700 border-amber-100',IV:'bg-purple-50 text-purple-700 border-purple-100'}[v] || 'bg-slate-50 text-slate-700 border-slate-100')

export default function ProductDetailClient({ data }) {
  const { product, brand, related } = data
  const addItem = useCart(s => s.addItem)
  const openCart = useCart(s => s.openCart)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('overview')
  const discount = pct(product.price, product.originalPrice)

  const specs = [
    { k: 'Validation', v: product.validation },
    { k: 'Issuance', v: product.issuance },
    { k: 'Warranty', v: product.warranty },
    { k: 'Encryption', v: product.encryption },
    { k: 'Wildcard', v: product.wildcard ? 'Yes — unlimited subdomains' : 'No' },
    { k: 'Multi-domain', v: product.multiDomain ? 'Yes — up to 250 SANs' : 'No' },
    { k: 'Refund', v: '30-day money-back guarantee' },
    { k: 'Reissues', v: 'Free unlimited during term' },
  ]

  const handleAdd = () => { addItem(product, qty); toast.success('Added to cart', { description: `${qty} x ${product.name}` }) }
  const handleBuy = () => { addItem(product, qty); openCart() }

  return (
    <div className="container-x py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-slate-900">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/ssl-certificates" className="hover:text-slate-900">SSL Certificates</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/ssl-certificates?category=${product.categorySlug}`} className="hover:text-slate-900">{product.categorySlug}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
        {/* MAIN */}
        <div>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold', valColor(product.validation))}>{product.validation}</span>
            <span className="text-sm font-medium text-slate-600">{product.brandName}</span>
            {product.featured && <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">Featured</span>}
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{product.name}</h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl">{product.shortDescription}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700"><Zap className="h-4 w-4 text-blue-600" />{product.issuance}</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700"><Award className="h-4 w-4 text-blue-600" />{product.warranty} warranty</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700"><Lock className="h-4 w-4 text-blue-600" />{product.encryption}</span>
            {product.wildcard && <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-700"><Globe className="h-4 w-4" />Wildcard</span>}
          </div>

          {/* TABS */}
          <div className="mt-10 border-b border-slate-200 flex gap-6">
            {[{k:'overview',l:'Overview'},{k:'features',l:'Features'},{k:'specs',l:'Specifications'},{k:'browsers',l:'Compatibility'}].map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k)} className={cn('py-3 text-sm font-medium border-b-2 transition -mb-px', tab===t.k?'border-blue-600 text-blue-700':'border-transparent text-slate-500 hover:text-slate-900')}>{t.l}</button>
            ))}
          </div>

          <div className="mt-6">
            {tab === 'overview' && (
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed">{product.description}</p>
                {brand && (
                  <div className="mt-6 card-elevated p-5 not-prose">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white text-sm font-bold">{brand.name?.[0]}</div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Issued by {brand.name}</div>
                        <div className="text-xs text-slate-500">{brand.description}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === 'features' && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(product.features || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-3 w-3" /></div>
                    <span className="text-sm text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>
            )}
            {tab === 'specs' && (
              <div className="card-elevated overflow-hidden">
                {specs.map((s, i) => (
                  <div key={s.k} className={cn('grid grid-cols-2 border-b border-slate-100 last:border-0', i % 2 === 1 && 'bg-slate-50/40')}>
                    <div className="p-4 text-sm font-medium text-slate-500">{s.k}</div>
                    <div className="p-4 text-sm text-slate-900">{s.v}</div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'browsers' && (
              <div className="card-elevated p-6">
                <p className="text-sm text-slate-600 mb-4">This certificate is trusted on 99.9% of desktop and mobile browsers.</p>
                <div className="flex flex-wrap gap-2">
                  {(product.browsers || []).map(b => (
                    <span key={b} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />{b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related */}
          {related?.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold text-slate-900">You may also like</h2>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {related.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>

        {/* STICKY BUY BOX */}
        <aside>
          <div className="lg:sticky lg:top-24">
            <div className="card-elevated p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-900">{formatINR(product.price)}</span>
                {product.originalPrice > product.price && <span className="text-sm text-slate-400 line-through">{formatINR(product.originalPrice)}</span>}
                {discount > 0 && <span className="ml-1 inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">Save {discount}%</span>}
              </div>
              <div className="mt-1 text-xs text-slate-500">per year · excl. 18% GST</div>

              <div className="mt-5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Quantity</label>
                <div className="inline-flex items-center rounded-lg border border-slate-200">
                  <button onClick={()=>setQty(q=>Math.max(1,q-1))} className="h-9 w-9 text-slate-600 hover:bg-slate-50">-</button>
                  <span className="grid h-9 w-10 place-items-center text-sm font-medium">{qty}</span>
                  <button onClick={()=>setQty(q=>q+1)} className="h-9 w-9 text-slate-600 hover:bg-slate-50">+</button>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <Button size="lg" className="w-full h-12" onClick={handleBuy}>Buy Now <ArrowRight className="ml-1 h-4 w-4" /></Button>
                <Button size="lg" variant="outline" className="w-full h-12" onClick={handleAdd}>Add to Cart</Button>
                <button className="mt-1 w-full text-center text-xs text-slate-500 hover:text-slate-900 inline-flex items-center justify-center gap-1"><Heart className="h-3.5 w-3.5" /> Save to wishlist</button>
              </div>

              <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
                {[{i:ShieldCheck,t:'Trusted CA issuance'},{i:Zap,t:`Issued in ${product.issuance}`},{i:Award,t:`${product.warranty} warranty`},{i:Lock,t:'Secure encrypted checkout'}].map((x,i)=>{
                  const I=x.i
                  return (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <I className="h-4 w-4 text-blue-600" />{x.t}
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500">Server re-validates prices at checkout · SSL protected</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
