'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Copy, CheckCircle2, Send, Upload, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const INR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)

const STATUSES = ['CREATED','PAID','CSR_SUBMITTED','DCV_INSTRUCTIONS','DCV_COMPLETED','ISSUED','CANCELLED']
const PAYMENTS = ['PENDING','PAID','REFUNDED','FAILED']

export default function OrderDetail({ orderNumber }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Order not found')
      setOrder(await res.json())
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [orderNumber])

  const patch = async (body) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Update failed')
      setOrder(await res.json())
      toast.success('Order updated')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <div className="p-10 text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading...</div>
  if (!order) return null

  return (
    <div className="p-4 md:p-8 lg:p-10">
      <div className="text-xs text-slate-500 mb-3"><Link href="/admin/orders" className="hover:text-slate-900"><ArrowLeft className="inline h-4 w-4 mr-1" />Back to orders</Link></div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Order number</div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-mono">{order.orderNumber}</h1>
          <div className="mt-1 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString('en-IN')} · {order.customer.email}</div>
        </div>
        <Link href={`/orders/${order.orderNumber}?email=${encodeURIComponent(order.customer.email)}`} target="_blank" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" />View customer page</Link>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</h2>
          <div><div className="text-[11px] text-slate-500">Name</div><div className="text-sm font-semibold">{order.customer.name}</div></div>
          <div><div className="text-[11px] text-slate-500">Email</div><div className="text-sm">{order.customer.email} <button onClick={() => { navigator.clipboard.writeText(order.customer.email); toast.success('Copied') }}><Copy className="inline h-3 w-3 text-slate-400" /></button></div></div>
          <div><div className="text-[11px] text-slate-500">Phone</div><div className="text-sm">{order.customer.phone || '—'}</div></div>
          <div><div className="text-[11px] text-slate-500">Company</div><div className="text-sm">{order.customer.company || '—'}</div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Billing / GST</h2>
          <div className="text-sm text-slate-700">{[order.billing?.address, order.billing?.city, order.billing?.state, order.billing?.postalCode, order.billing?.country].filter(Boolean).join(', ') || '—'}</div>
          <div><div className="text-[11px] text-slate-500">GSTIN</div><div className="text-sm font-mono">{order.gst?.gstNumber || '—'}</div></div>
          <div><div className="text-[11px] text-slate-500">GST company</div><div className="text-sm">{order.gst?.companyName || '—'}</div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment & Status</h2>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span>{INR(order.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">GST 18%</span><span>{INR(order.tax)}</span></div>
          <div className="flex justify-between text-base font-bold border-t border-slate-100 pt-2"><span>Total</span><span>{INR(order.total)}</span></div>
          <div className="pt-3 space-y-2">
            <div><Label className="text-[11px]">Payment status</Label>
              <Select value={order.paymentStatus} onValueChange={v => patch({ paymentStatus: v, ...(v === 'PAID' && order.status === 'CREATED' ? { status: 'PAID' } : {}) })}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[11px]">Order status</Label>
              <Select value={order.status} onValueChange={v => patch({ status: v })}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 space-y-5">
        {order.items.map((it, idx) => (
          <AdminItem key={idx} order={order} idx={idx} onUpdate={setOrder} />
        ))}
      </div>
    </div>
  )
}

function AdminItem({ order, idx, onUpdate }) {
  const item = order.items[idx]
  const f = item.fulfillment || {}
  const [dcvInstructions, setDcvInstructions] = useState(f.dcvInstructions || '')
  const [certificate, setCertificate] = useState(f.certificate || '')
  const [chain, setChain] = useState(f.chain || '')
  const [expiresAt, setExpiresAt] = useState(f.expiresAt ? new Date(f.expiresAt).toISOString().slice(0,10) : new Date(Date.now() + 365*24*3600*1000).toISOString().slice(0,10))
  const [saving, setSaving] = useState(false)

  const postDcv = async () => {
    if (!dcvInstructions.trim()) { toast.error('Enter DCV instructions'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.orderNumber}/items/${idx}/dcv`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dcvInstructions }),
      })
      if (!res.ok) throw new Error('Failed')
      onUpdate(await res.json())
      toast.success('DCV instructions sent to customer')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const uploadCert = async () => {
    if (!certificate.includes('BEGIN CERTIFICATE')) { toast.error('Paste a valid certificate PEM'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.orderNumber}/items/${idx}/certificate`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate, chain, expiresAt }),
      })
      if (!res.ok) throw new Error('Failed')
      onUpdate(await res.json())
      toast.success('Certificate uploaded — customer can now download it')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">{item.validation}</span>
            <span className="text-slate-500">{item.brandName}</span>
            {item.wildcard && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">Wildcard</span>}
            {item.multiDomain && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">Multi-Domain</span>}
          </div>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{item.name}</h3>
          <div className="mt-1 text-xs text-slate-500">Qty {item.qty} · Issuance {item.issuance} · Warranty {item.warranty}</div>
        </div>
        <div className="text-right"><div className="text-[11px] text-slate-500">Line total</div><div className="font-bold">{INR(item.lineTotal)}</div></div>
      </div>

      {/* CSR from customer */}
      {f.csr ? (
        <div className="mt-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><CheckCircle2 className="h-4 w-4 text-emerald-600" />CSR received from customer <span className="text-slate-400">· {f.csrSubmittedAt && new Date(f.csrSubmittedAt).toLocaleString('en-IN')}</span></div>
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-3 relative">
            <button onClick={() => { navigator.clipboard.writeText(f.csr); toast.success('CSR copied — paste to CA') }} className="absolute top-2 right-2 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] text-slate-100"><Copy className="inline h-3 w-3 mr-1" />Copy CSR</button>
            <pre className="text-[10px] font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{f.csr}</pre>
          </div>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div><span className="text-slate-500">DCV method:</span> <b>{(f.dcvMethod || '').toUpperCase() || '—'}</b></div>
            <div><span className="text-slate-500">Customer note:</span> <b>{f.dcvSubmittedInfo || '—'}</b></div>
            <div><span className="text-slate-500">Status:</span> <b>{f.status?.replace(/_/g,' ')}</b></div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">Customer has not submitted a CSR yet.</div>
      )}

      {/* DCV instructions to customer */}
      {f.csr && !f.certificate && (
        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-700">Post DCV instructions to customer</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Paste the exact validation instructions from the CA. The customer will see these on their tracking page and complete DCV.</p>
          <Textarea rows={6} value={dcvInstructions} onChange={e => setDcvInstructions(e.target.value)} className="mt-2 font-mono text-xs" placeholder={`For DNS validation:\n\nAdd a TXT record at _dnsauth.example.com with value:\nsCUEZuQXynwR-3JBaFGXjqPiTZ7-...\n\nOnce added, click "I've completed DCV" on your order page.`} />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={postDcv} disabled={saving}><Send className="mr-2 h-3.5 w-3.5" />Send to customer</Button>
            {f.dcvInstructions && <span className="text-[11px] text-emerald-700 self-center">Last sent {f.dcvInstructionsAt && new Date(f.dcvInstructionsAt).toLocaleString('en-IN')}</span>}
          </div>
        </div>
      )}

      {/* DCV completed indicator */}
      {f.dcvCompletedAt && !f.certificate && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />Customer marked DCV complete on {new Date(f.dcvCompletedAt).toLocaleString('en-IN')}. Verify with the CA, retrieve the issued certificate and upload it below.</div>
      )}

      {/* Upload certificate */}
      {f.csr && (
        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-700">Upload issued certificate</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Paste the certificate + CA chain PEM you received from the CA. Customer will be able to download all files.</p>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Certificate (.crt)</Label>
              <Textarea rows={7} value={certificate} onChange={e => setCertificate(e.target.value)} className="mt-1 font-mono text-[11px]" placeholder="-----BEGIN CERTIFICATE-----" />
            </div>
            <div>
              <Label className="text-[11px]">CA chain / intermediate (optional)</Label>
              <Textarea rows={7} value={chain} onChange={e => setChain(e.target.value)} className="mt-1 font-mono text-[11px]" placeholder="-----BEGIN CERTIFICATE-----" />
            </div>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <div><Label className="text-[11px]">Expires on</Label><Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="mt-1 w-44" /></div>
            <Button size="sm" onClick={uploadCert} disabled={saving}><Upload className="mr-2 h-3.5 w-3.5" />{f.certificate ? 'Replace certificate' : 'Upload & mark issued'}</Button>
            {f.issuedAt && <span className="text-[11px] text-emerald-700 self-center">Issued {new Date(f.issuedAt).toLocaleString('en-IN')}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
