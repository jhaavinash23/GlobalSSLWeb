'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Circle, Clock, Loader2, Upload, ShieldCheck, Download, Copy, AlertCircle, Info, Mail, Server, Globe2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS_STEPS = [
  { k: 'CREATED', label: 'Order placed' },
  { k: 'PAID', label: 'Payment confirmed' },
  { k: 'CSR_SUBMITTED', label: 'CSR received' },
  { k: 'DCV_INSTRUCTIONS', label: 'DCV instructions' },
  { k: 'DCV_COMPLETED', label: 'DCV completed' },
  { k: 'ISSUED', label: 'Certificate issued' },
]
const STATUS_INDEX = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.k, i]))

const DCV_METHODS = [
  { k: 'email', label: 'Email validation', icon: Mail, help: 'CA sends a verification link to admin@yourdomain.com or similar. Fastest for DV.' },
  { k: 'dns',   label: 'DNS TXT record',    icon: Server, help: 'Add a TXT record to your DNS zone. Best when you can\'t receive email at the domain.' },
  { k: 'http',  label: 'HTTP file',         icon: Globe2, help: 'Host a small text file at http://yourdomain.com/.well-known/pki-validation/. Best if you already own the web server.' },
]

export default function OrderTracking({ orderNumber, emailParam, isNew }) {
  const [email, setEmail] = useState(emailParam)
  const [emailInput, setEmailInput] = useState(emailParam)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = async () => {
    setLoading(true)
    setErr('')
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Order not found')
      const o = await res.json()
      setOrder(o)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [orderNumber])

  const canView = email && order && (email.toLowerCase() === order.customer?.email?.toLowerCase())
  const activeStep = order ? Math.max(0, STATUS_INDEX[order.status] ?? 0) : 0

  if (loading) return <div className="container-x py-16 text-center text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading order...</div>
  if (err || !order) return (
    <div className="container-x py-16 text-center">
      <div className="mx-auto max-w-md card-elevated p-10">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-bold">Order not found</h1>
        <p className="mt-2 text-sm text-slate-600">Check the order number and try again.</p>
        <Button asChild className="mt-6"><Link href="/">Back to home</Link></Button>
      </div>
    </div>
  )

  if (!canView) {
    return (
      <div className="container-x py-12 max-w-md">
        <div className="card-elevated p-8">
          <h1 className="text-xl font-bold text-slate-900">View order {order.orderNumber}</h1>
          <p className="mt-2 text-sm text-slate-600">Enter the email address used when placing this order.</p>
          <form onSubmit={e => { e.preventDefault(); setEmail(emailInput) }} className="mt-6 space-y-3">
            <div><Label className="text-xs">Email</Label><Input type="email" required value={emailInput} onChange={e => setEmailInput(e.target.value)} className="mt-1" /></div>
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="container-x py-8 md:py-12">
      {isNew && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-white shrink-0"><CheckCircle2 className="h-5 w-5" /></div>
          <div>
            <h2 className="font-semibold text-emerald-900">Order placed successfully!</h2>
            <p className="text-sm text-emerald-800 mt-1">We&apos;ve saved your order. Bookmark this page — you&apos;ll manage payment, CSR submission and certificate download from here.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Order number</div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-mono">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">Placed for {order.customer.name} · {order.customer.email}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Total</div>
          <div className="text-2xl font-bold">{formatINR(order.total)}</div>
          <div className="text-[11px] text-slate-500">Payment: <span className={cn('font-semibold', order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600')}>{order.paymentStatus}</span></div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-8 card-elevated p-6">
        <h2 className="text-sm font-semibold text-slate-900">Fulfilment progress</h2>
        <div className="mt-5 flex items-center gap-1 overflow-x-auto">
          {STATUS_STEPS.map((s, i) => {
            const done = i < activeStep
            const current = i === activeStep
            return (
              <div key={s.k} className="flex items-center gap-1 shrink-0">
                <div className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border',
                  done && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  current && 'bg-blue-50 text-blue-700 border-blue-200',
                  !done && !current && 'bg-slate-50 text-slate-500 border-slate-200'
                )}>
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : current ? <Clock className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  {s.label}
                </div>
                {i < STATUS_STEPS.length - 1 && <div className={cn('h-0.5 w-6', done ? 'bg-emerald-300' : 'bg-slate-200')} />}
              </div>
            )
          })}
        </div>
      </div>

      {order.paymentStatus !== 'PAID' && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-semibold text-amber-900 flex items-center gap-2"><Info className="h-4 w-4" />Awaiting payment</h2>
          <p className="mt-1 text-sm text-amber-800">Complete the payment via UPI / bank transfer using the details below. Once we confirm receipt, you&apos;ll be able to submit CSR and continue certificate issuance.</p>
          <div className="mt-3 rounded-xl border border-amber-200 bg-white p-4 text-sm text-slate-700 font-mono">
            <div>Amount: <span className="font-bold text-slate-900">{formatINR(order.total)}</span></div>
            <div>UPI ID: <span className="font-semibold">payments@globalsslweb</span> <button onClick={() => { navigator.clipboard.writeText('payments@globalsslweb'); toast.success('UPI copied') }} className="ml-1 text-blue-600 text-xs"><Copy className="inline h-3 w-3" /></button></div>
            <div>Reference: <span className="font-semibold">{order.orderNumber}</span></div>
          </div>
        </div>
      )}

      {/* Items with fulfillment per line */}
      <div className="mt-6 space-y-5">
        {order.items.map((it, idx) => (
          <ItemFulfilment key={idx} order={order} idx={idx} email={email} onUpdate={setOrder} paymentPaid={order.paymentStatus === 'PAID'} />
        ))}
      </div>
    </div>
  )
}

function ItemFulfilment({ order, idx, email, onUpdate, paymentPaid }) {
  const item = order.items[idx]
  const f = item.fulfillment || {}
  const [csr, setCsr] = useState('')
  const [dcvMethod, setDcvMethod] = useState('email')
  const [dcvInfo, setDcvInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submitCsr = async () => {
    if (!paymentPaid) { toast.error('Please complete payment first'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/csr`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIndex: idx, csr, dcvMethod, dcvSubmittedInfo: dcvInfo, email }),
      })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed') }
      const updated = await res.json()
      onUpdate(updated)
      toast.success('CSR submitted! Our team will provide DCV instructions shortly.')
    } catch (e) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  const markDcvDone = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/dcv-completed`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIndex: idx, email }),
      })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed') }
      onUpdate(await res.json())
      toast.success('DCV marked complete. We\'ll finalise your certificate.')
    } catch (e) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  const download = (kind) => {
    window.location.href = `/api/orders/${order.orderNumber}/items/${idx}/download?kind=${kind}&email=${encodeURIComponent(email)}`
  }

  const stage = f.status || 'AWAITING_CSR'

  return (
    <div className="card-elevated p-6">
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
        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', stage === 'ISSUED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700')}>{stage.replace(/_/g, ' ')}</span>
      </div>

      {/* AWAITING_CSR stage */}
      {stage === 'AWAITING_CSR' && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-blue-900"><Upload className="h-4 w-4" />Step 1: Submit your CSR</div>
            <p className="mt-1 text-slate-700">Generate a CSR on your server (e.g. <code className="rounded bg-white px-1 py-0.5 text-xs">openssl req -new -newkey rsa:2048 -nodes -keyout your.key -out your.csr</code>) and paste the entire block including <code className="rounded bg-white px-1 py-0.5 text-xs">-----BEGIN CERTIFICATE REQUEST-----</code>.</p>
          </div>
          <div>
            <Label className="text-xs">Paste your CSR (PEM)</Label>
            <Textarea value={csr} onChange={e => setCsr(e.target.value)} rows={7} className="mt-1 font-mono text-xs" placeholder="-----BEGIN CERTIFICATE REQUEST-----&#10;MIIC..." />
          </div>
          <div>
            <Label className="text-xs">Domain validation method</Label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              {DCV_METHODS.map(m => {
                const Icon = m.icon
                return (
                  <button type="button" key={m.k} onClick={() => setDcvMethod(m.k)} className={cn('text-left rounded-xl border p-3 transition', dcvMethod === m.k ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 hover:border-slate-300')}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon className="h-4 w-4 text-blue-600" />{m.label}</div>
                    <p className="mt-1 text-[11px] text-slate-600">{m.help}</p>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <Label className="text-xs">
              {dcvMethod === 'email' ? 'Preferred admin email at the domain' : dcvMethod === 'dns' ? 'DNS provider (optional info)' : 'Server / hosting (optional info)'}
            </Label>
            <Input value={dcvInfo} onChange={e => setDcvInfo(e.target.value)} className="mt-1" placeholder={dcvMethod === 'email' ? 'admin@yourdomain.com' : dcvMethod === 'dns' ? 'Cloudflare, Route53, GoDaddy...' : 'nginx on Ubuntu 22.04'} />
          </div>
          <Button onClick={submitCsr} disabled={submitting || !csr || !paymentPaid}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mr-2 h-4 w-4" />Submit CSR & continue</>}
          </Button>
          {!paymentPaid && <p className="text-[11px] text-amber-700">Payment must be confirmed before we can accept your CSR.</p>}
        </div>
      )}

      {/* CSR_SUBMITTED — waiting for admin DCV instructions */}
      {stage === 'CSR_SUBMITTED' && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-blue-900"><Clock className="h-4 w-4" />CSR received — awaiting DCV instructions</div>
          <p className="mt-1 text-slate-700">Our team is submitting your CSR to <b>{item.brandName}</b>. You&apos;ll see the domain validation instructions here shortly. This usually takes 15 minutes to a few hours.</p>
        </div>
      )}

      {/* DCV_INSTRUCTIONS — show to customer */}
      {(stage === 'DCV_INSTRUCTIONS') && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-amber-900"><Info className="h-4 w-4" />Step 2: Complete Domain Control Validation ({f.dcvMethod?.toUpperCase()})</div>
            <p className="mt-1 text-slate-700">Complete the instructions below exactly. Once done, click <b>&quot;I&apos;ve completed DCV&quot;</b> and we&apos;ll finalise your certificate.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4">
            <pre className="whitespace-pre-wrap break-all text-xs font-mono leading-relaxed">{f.dcvInstructions || 'Instructions will appear here...'}</pre>
          </div>
          <Button onClick={markDcvDone} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" />I&apos;ve completed DCV</>}
          </Button>
        </div>
      )}

      {stage === 'DCV_COMPLETED' && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-blue-900"><Clock className="h-4 w-4" />DCV completed — final issuance in progress</div>
          <p className="mt-1 text-slate-700">The CA is issuing your certificate now. You&apos;ll be able to download it here as soon as it&apos;s ready.</p>
        </div>
      )}

      {stage === 'ISSUED' && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-emerald-900"><ShieldCheck className="h-4 w-4" />Certificate issued</div>
            <p className="mt-1 text-sm text-slate-700">Issued {f.issuedAt && new Date(f.issuedAt).toLocaleDateString()}. Expires {f.expiresAt && new Date(f.expiresAt).toLocaleDateString()}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => download('cert')}><Download className="mr-2 h-4 w-4" />Certificate (.crt)</Button>
            {f.chain && <Button size="sm" variant="outline" onClick={() => download('chain')}><Download className="mr-2 h-4 w-4" />CA chain</Button>}
            <Button size="sm" variant="outline" onClick={() => download('bundle')}><Download className="mr-2 h-4 w-4" />Full bundle</Button>
          </div>
        </div>
      )}

      {f.adminNote && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"><b>Note from our team:</b> {f.adminNote}</div>
      )}
    </div>
  )
}
