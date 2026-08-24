'use client'
import { useCart } from '@/lib/store/cart'
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty } = useCart()
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = Math.round(subtotal * 0.18)
  const total = subtotal + tax
  return (
    <>
      <div className={cn('fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity', isOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={closeCart} />
      <aside className={cn('fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col', isOpen ? 'translate-x-0' : 'translate-x-full')}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold">Your cart</h2>
            <span className="text-xs text-slate-500">({items.length} item{items.length!==1?'s':''})</span>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}><X className="h-5 w-5" /></Button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-blue-50"><ShoppingCart className="h-7 w-7 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-900">Your cart is empty</h3>
            <p className="text-xs text-slate-500 max-w-[240px]">Browse our premium SSL certificates to secure your website in minutes.</p>
            <Button asChild size="sm" onClick={closeCart}><Link href="/ssl-certificates">Browse certificates</Link></Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {items.map(i => (
                <div key={i.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><span className="rounded bg-slate-100 px-1.5 py-0.5">{i.validation}</span>{i.brandName}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 line-clamp-2">{i.name}</div>
                    </div>
                    <button onClick={() => removeItem(i.id)} className="text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-slate-200">
                      <button onClick={() => updateQty(i.id, i.qty - 1)} className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="grid h-8 w-8 place-items-center text-sm font-medium">{i.qty}</span>
                      <button onClick={() => updateQty(i.id, i.qty + 1)} className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{formatINR(i.price * i.qty)}</div>
                      {i.originalPrice > i.price && <div className="text-[11px] text-slate-400 line-through">{formatINR(i.originalPrice * i.qty)}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 p-5 space-y-3">
              <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-slate-600"><span>GST (18%)</span><span>{formatINR(tax)}</span></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-100"><span>Total</span><span>{formatINR(total)}</span></div>
              <Button asChild className="w-full" size="lg" onClick={closeCart}>
                <Link href="/cart">View cart & checkout <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <p className="text-center text-[11px] text-slate-500">Prices are re-verified on checkout · Secure payment</p>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
