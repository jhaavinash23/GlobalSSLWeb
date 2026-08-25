'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Send, ArrowLeft, LifeBuoy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_COLORS = { OPEN: 'bg-blue-50 text-blue-700 border-blue-200', IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200', RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200', CLOSED: 'bg-slate-100 text-slate-700 border-slate-200' }

export default function TicketThread({ ticketNumber, emailParam }) {
  const [email, setEmail] = useState(emailParam)
  const [emailInput, setEmailInput] = useState(emailParam)
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  const load = async (eml = email) => {
    setLoading(true); setErr('')
    try {
      const url = `/api/support/tickets/${ticketNumber}${eml ? `?email=${encodeURIComponent(eml)}` : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Not found') }
      setTicket(await res.json())
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { if (email) load(); else setLoading(false) }, [email])

  const send = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/tickets/${ticketNumber}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, body: reply }) })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed') }
      setTicket(await res.json())
      setReply('')
      toast.success('Reply sent')
    } catch (e) { toast.error(e.message) }
    finally { setSending(false) }
  }

  if (!email) {
    return (
      <div className="container-x py-12 max-w-md">
        <div className="card-elevated p-8">
          <h1 className="text-xl font-bold">View ticket {ticketNumber}</h1>
          <p className="mt-2 text-sm text-slate-500">Enter the email you used when opening this ticket.</p>
          <form onSubmit={e => { e.preventDefault(); setEmail(emailInput) }} className="mt-5 space-y-3">
            <div><Label className="text-xs">Email</Label><Input type="email" required value={emailInput} onChange={e => setEmailInput(e.target.value)} className="mt-1" /></div>
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) return <div className="container-x py-16 text-center text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading ticket...</div>
  if (err || !ticket) return (
    <div className="container-x py-16 text-center">
      <div className="mx-auto max-w-md card-elevated p-10"><AlertCircle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-bold">Can&apos;t open ticket</h1><p className="mt-2 text-sm text-slate-600">{err}</p><Button asChild className="mt-6"><Link href="/support/new">New ticket</Link></Button></div>
    </div>
  )

  const canReply = ticket.status !== 'CLOSED'
  return (
    <div className="container-x py-8 md:py-12 max-w-3xl">
      <div className="text-xs text-slate-500 mb-3"><Link href="/account" className="hover:text-slate-900"><ArrowLeft className="inline h-4 w-4 mr-1" />Back to my account</Link></div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><LifeBuoy className="h-3.5 w-3.5" />{ticket.ticketNumber}</div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{ticket.subject}</h1>
          {ticket.orderNumber && <div className="mt-1 text-sm text-slate-500">Order <Link href={`/orders/${ticket.orderNumber}?email=${encodeURIComponent(ticket.email)}`} className="font-mono text-blue-600 hover:underline">{ticket.orderNumber}</Link></div>}
        </div>
        <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN)}>{(ticket.status || '').replace(/_/g,' ')}</span>
      </div>

      <div className="mt-6 space-y-3">
        {(ticket.messages || []).map((m, i) => {
          const admin = m.author === 'admin'
          return (
            <div key={i} className={cn('flex gap-3', admin ? 'flex-row-reverse' : '')}>
              <div className={cn('grid h-8 w-8 place-items-center rounded-full text-white text-xs font-semibold shrink-0', admin ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-600 to-blue-500')}>{admin ? 'S' : (m.name?.[0]?.toUpperCase() || 'U')}</div>
              <div className={cn('max-w-[85%] rounded-2xl p-3.5', admin ? 'bg-slate-900 text-slate-100' : 'bg-white border border-slate-200')}>
                <div className={cn('text-[11px] mb-1', admin ? 'text-slate-400' : 'text-slate-500')}>{admin ? 'GlobalSSLWeb Support' : m.name} · {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                <div className={cn('text-sm whitespace-pre-wrap break-words', admin ? 'text-slate-100' : 'text-slate-800')}>{m.body}</div>
              </div>
            </div>
          )
        })}
      </div>

      {canReply ? (
        <div className="mt-6 card-elevated p-5">
          <Label className="text-xs">Reply to this thread</Label>
          <Textarea value={reply} onChange={e => setReply(e.target.value)} rows={4} className="mt-1" placeholder="Type your reply…" />
          <div className="mt-3 flex justify-end"><Button onClick={send} disabled={sending || !reply.trim()}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Send reply</>}</Button></div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 text-center">This ticket is closed. <Link href="/support/new" className="text-blue-600 hover:underline">Open a new ticket</Link> if you need more help.</div>
      )}
    </div>
  )
}
