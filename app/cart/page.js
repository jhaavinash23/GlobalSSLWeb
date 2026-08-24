'use client'
import { useCart } from '@/lib/store/cart'
import Link from 'next/link'
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, ShieldCheck, Lock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/format'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function CartPage() {
  const { items, removeItem, updateQty, clear } = useCart()
  const [validated, setValidated] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (items.length === 0) { setValidated(null); return }
    setLoading(true)
    fetch('/api/cart/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) })
      .then(r => r.json()).then(d => { setValidated(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [items])

  if (items.length === 0) {
    return (
      <div className="container-x py-16">
        <div className="mx-auto max-w-md card-elevated p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50"><ShoppingCart className="h-7 w-7 text-blue-600" /></div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-slate-600">Discover premium SSL certificates that fit your business.</p>
          <Button asChild size="lg" className="mt-6"><Link href="/ssl-certificates">Browse Certificates</Link></Button>
        </div>
      </div>
    )
  }

  const subtotal = validated?.subtotal ?? items.reduce((s,i)=>s+i.price*i.qty,0)
  const tax = validated?.tax ?? Math.round(subtotal * 0.18)
  const total = validated?.total ?? (subtotal + tax)

  return (
    <div className="container-x py-8 md:py-12">
      <nav className="text-xs text-slate-500"><Link href="/" className="hover:text-slate-900">Home</Link> <span className="mx-2">/</span> <span className="text-slate-700">Cart</span></nav>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Your cart</h1>
        <button onClick={()=>{clear(); toast.success('Cart cleared')}} className="text-sm text-slate-500 hover:text-red-600 inline-flex items-center gap-1"><Trash2 className="h-4 w-4" />Clear cart</button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-4">
          {items.map(i => (
            <div key={i.id} className="card-elevated p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{i.validation}</span>
                    <span className="text-slate-500">{i.brandName}</span>
                  </div>
                  <Link href={`/ssl-certificates/${i.slug}`} className="mt-2 block text-base font-semibold text-slate-900 hover:text-blue-700">{i.name}</Link>
                  <div className="mt-1 text-xs text-slate-500">1-year certificate · free reissues</div>
                </div>
                <div className="flex items-center sm:items-end justify-between sm:flex-col gap-3">
                  <div className="inline-flex items-center rounded-lg border border-slate-200">
                    <button onClick={()=>updateQty(i.id, i.qty-1)} className="grid h-9 w-9 place-items-center text-slate-600 hover:bg-slate-50"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="grid h-9 w-10 place-items-center text-sm font-medium">{i.qty}</span>
                    <button onClick={()=>updateQty(i.id, i.qty+1)} className="grid h-9 w-9 place-items-center text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">{formatINR(i.price * i.qty)}</div>
                    {i.originalPrice > i.price && <div className="text-xs text-slate-400 line-through">{formatINR(i.originalPrice * i.qty)}</div>}
                  </div>
                  <button onClick={()=>{removeItem(i.id); toast('Removed from cart')}} className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" />Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="card-elevated p-6">
            <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
            <div className="mt-5 space-y-3">
              <div className="flex justify-between text-sm text-slate-600"><span>Subtotal ({items.reduce((s,i)=>s+i.qty,0)} items)</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-slate-600"><span>GST (18%)</span><span>{formatINR(tax)}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-slate-100 pt-3"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
            <Button size="lg" className="mt-6 w-full h-12" onClick={()=>toast.info('Checkout coming in Phase 2', { description: 'Razorpay + auth land next.' })}>
              Proceed to Checkout <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Server-verified prices</div>
              <div className="flex items-center gap-1.5 text-slate-600"><Lock className="h-3.5 w-3.5 text-emerald-600" />PCI-DSS checkout</div>
            </div>
            {loading && <p className="mt-4 text-[11px] text-slate-500 flex items-center gap-1"><Info className="h-3 w-3" />Re-validating with server…</p>}
            {!loading && validated && <p className="mt-4 text-[11px] text-emerald-700 flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Prices verified server-side</p>}
          </div>
          <div className="mt-4 text-center"><Link href="/ssl-certificates" className="text-sm font-medium text-blue-600 hover:text-blue-700">← Continue shopping</Link></div>
        </aside>
      </div>
    </div>
  )
}
