'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/store/cart'
import { formatINR } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ShoppingCart, Lock, Loader2, ArrowRight, Building2, User, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clear } = useCart()
  const [validated, setValidated] = useState(null)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState({
    name: '', email: '', phone: '', company: '',
    address: '', city: '', state: '', postalCode: '', country: 'India',
    gstNumber: '', gstCompany: '',
  })
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    if (!items.length) return
    fetch('/api/cart/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) })
      .then(r => r.json()).then(setValidated).catch(() => {})
  }, [items])

  if (!items.length) {
    return (
      <div className="container-x py-16 text-center">
        <div className="mx-auto max-w-md card-elevated p-10">
          <ShoppingCart className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-4 text-xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-slate-600">Add certificates to your cart before checking out.</p>
          <Button asChild className="mt-6"><Link href="/ssl-certificates">Browse certificates</Link></Button>
        </div>
      </div>
    )
  }

  const subtotal = validated?.subtotal ?? items.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = validated?.tax ?? Math.round(subtotal * 0.18)
  const total = validated?.total ?? (subtotal + tax)

  const submit = async (e) => {
    e.preventDefault()
    if (!f.name || !f.email) { toast.error('Name and email are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: f.name, email: f.email, phone: f.phone, company: f.company },
          billing: { address: f.address, city: f.city, state: f.state, postalCode: f.postalCode, country: f.country },
          gst: { gstNumber: f.gstNumber, companyName: f.gstCompany },
          items: items.map(i => ({ id: i.id, qty: i.qty })),
          paymentMethod: 'manual',
        }),
      })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed to place order') }
      const data = await res.json()
      toast.success('Order placed!')
      clear()
      router.push(`/orders/${data.orderNumber}?email=${encodeURIComponent(f.email)}&new=1`)
    } catch (err) { toast.error(err.message); setSaving(false) }
  }

  return (
    <div className="container-x py-8 md:py-12">
      <nav className="text-xs text-slate-500"><Link href="/" className="hover:text-slate-900">Home</Link> <span className="mx-2">/</span> <Link href="/cart" className="hover:text-slate-900">Cart</Link> <span className="mx-2">/</span> <span className="text-slate-700">Checkout</span></nav>
      <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Checkout</h1>

      <form onSubmit={submit} className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-5">
          <section className="card-elevated p-6 space-y-4">
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-semibold text-slate-900">Customer information</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs">Full name *</Label><Input value={f.name} onChange={e => set('name', e.target.value)} className="mt-1" required /></div>
              <div><Label className="text-xs">Email *</Label><Input type="email" value={f.email} onChange={e => set('email', e.target.value)} className="mt-1" required /></div>
              <div><Label className="text-xs">Phone</Label><Input value={f.phone} onChange={e => set('phone', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Company</Label><Input value={f.company} onChange={e => set('company', e.target.value)} className="mt-1" /></div>
            </div>
          </section>

          <section className="card-elevated p-6 space-y-4">
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-semibold text-slate-900">Billing address</h2></div>
            <div><Label className="text-xs">Street address</Label><Input value={f.address} onChange={e => set('address', e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className="text-xs">City</Label><Input value={f.city} onChange={e => set('city', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">State</Label><Input value={f.state} onChange={e => set('state', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Postal code</Label><Input value={f.postalCode} onChange={e => set('postalCode', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Country</Label><Input value={f.country} onChange={e => set('country', e.target.value)} className="mt-1" /></div>
            </div>
          </section>

          <section className="card-elevated p-6 space-y-4">
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-semibold text-slate-900">GST details (optional)</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs">GSTIN</Label><Input value={f.gstNumber} onChange={e => set('gstNumber', e.target.value.toUpperCase())} className="mt-1 font-mono" placeholder="22AAAAA0000A1Z5" /></div>
              <div><Label className="text-xs">Registered company name</Label><Input value={f.gstCompany} onChange={e => set('gstCompany', e.target.value)} className="mt-1" /></div>
            </div>
          </section>

          <section className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-3"><Lock className="h-4 w-4 text-emerald-600" /><h2 className="text-sm font-semibold text-slate-900">Payment</h2></div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-700">
              <p className="font-medium text-blue-900">Manual payment (Bank transfer / UPI)</p>
              <p className="mt-1 text-xs text-slate-600">Place the order now. You&apos;ll get an order number + payment instructions on the next screen. Once payment is confirmed, we&apos;ll unlock the CSR submission step so the certificate can be issued.</p>
              <p className="mt-2 text-[11px] text-slate-500">Razorpay auto-checkout is coming soon.</p>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="card-elevated p-6">
            <h2 className="text-sm font-semibold text-slate-900">Order summary</h2>
            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map(i => (
                <div key={i.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-500">{i.validation} · {i.brandName}</div>
                    <div className="text-slate-900 font-medium leading-tight">{i.name}</div>
                    <div className="text-[11px] text-slate-500">Qty {i.qty}</div>
                  </div>
                  <div className="tabular-nums font-semibold">{formatINR(i.price * i.qty)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>GST (18%)</span><span>{formatINR(tax)}</span></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-100"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
            <Button type="submit" size="lg" className="mt-5 w-full h-12" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Place order <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
            <p className="mt-3 text-[11px] text-slate-500 text-center">By placing this order, you agree to receive order status emails.</p>
          </div>
        </aside>
      </form>
    </div>
  )
}
