'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Send, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function TicketDetail({ ticketNumber }) {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets/${ticketNumber}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Not found')
      setTicket(await res.json())
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [ticketNumber])

  const patch = async (body) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketNumber}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed')
      setTicket(await res.json()); toast.success('Updated')
    } catch (e) { toast.error(e.message) }
  }

  const send = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/tickets/${ticketNumber}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: reply }) })
      if (!res.ok) throw new Error('Failed')
      setTicket(await res.json()); setReply(''); toast.success('Reply sent — customer emailed')
    } catch (e) { toast.error(e.message) }
    finally { setSending(false) }
  }

  if (loading) return <div className="p-10 text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading...</div>
  if (!ticket) return null

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-5xl">
      <div className="text-xs text-slate-500 mb-3"><Link href="/admin/tickets" className="hover:text-slate-900"><ArrowLeft className="inline h-4 w-4 mr-1" />Back to inbox</Link></div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[11px] font-mono font-semibold text-slate-500">{ticket.ticketNumber}</div>
          <h1 className="mt-1 text-xl md:text-2xl font-bold tracking-tight text-slate-900">{ticket.subject}</h1>
          <div className="mt-1 text-sm text-slate-500">
            <b>{ticket.name}</b> · {ticket.email}
            {ticket.orderNumber && <> · Order <Link href={`/admin/orders/${ticket.orderNumber}`} className="font-mono text-blue-600 hover:underline">{ticket.orderNumber}</Link></>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-slate-500">Status</Label>
            <Select value={ticket.status} onValueChange={v => patch({ status: v })}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-slate-500">Priority</Label>
            <Select value={ticket.priority} onValueChange={v => patch({ priority: v })}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {(ticket.messages || []).map((m, i) => {
          const admin = m.author === 'admin'
          return (
            <div key={i} className={cn('flex gap-3', admin ? 'flex-row-reverse' : '')}>
              <div className={cn('grid h-8 w-8 place-items-center rounded-full text-white text-xs font-semibold shrink-0', admin ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-600 to-blue-500')}>{admin ? 'S' : (m.name?.[0]?.toUpperCase() || 'U')}</div>
              <div className={cn('max-w-[85%] rounded-2xl p-3.5', admin ? 'bg-slate-900 text-slate-100' : 'bg-white border border-slate-200')}>
                <div className={cn('text-[11px] mb-1', admin ? 'text-slate-400' : 'text-slate-500')}>{admin ? 'You (Support)' : m.name} · {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                <div className={cn('text-sm whitespace-pre-wrap break-words', admin ? 'text-slate-100' : 'text-slate-800')}>{m.body}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <Label className="text-xs">Reply to customer (emails them a copy)</Label>
        <Textarea value={reply} onChange={e => setReply(e.target.value)} rows={5} className="mt-1" placeholder="Type your response…" />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={() => patch({ status: 'RESOLVED' })}>Mark resolved</Button>
          <Button onClick={send} disabled={sending || !reply.trim()}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Send reply</>}</Button>
        </div>
      </div>
    </div>
  )
}
