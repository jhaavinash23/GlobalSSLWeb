'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LifeBuoy, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NewTicketForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const [f, setF] = useState({ name: '', email: '', subject: '', body: '', orderNumber: sp.get('order') || '', priority: 'normal' })
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d?.user) setF(prev => ({ ...prev, name: prev.name || d.user.name, email: prev.email || d.user.email }))
    }).catch(() => {})
  }, [])
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/support/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      toast.success('Ticket created — we\'ll reply within 24 business hours')
      router.push(`/support/tickets/${d.ticketNumber}?email=${encodeURIComponent(f.email)}`)
    } catch (err) { toast.error(err.message); setLoading(false) }
  }
  return (
    <div className="container-x py-8 md:py-12 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><LifeBuoy className="h-5 w-5" /></div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Contact support</h1>
      </div>
      <p className="text-sm text-slate-500 mb-8">Send us a message about your order, CSR, DCV or certificate. We reply within 24 business hours.</p>

      <form onSubmit={submit} className="card-elevated p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Your name *</Label><Input value={f.name} onChange={e => set('name', e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-xs">Email *</Label><Input type="email" value={f.email} onChange={e => set('email', e.target.value.toLowerCase())} className="mt-1" required /></div>
          <div><Label className="text-xs">Order number (optional)</Label><Input value={f.orderNumber} onChange={e => set('orderNumber', e.target.value.toUpperCase())} className="mt-1 font-mono" placeholder="GSSL-…" /></div>
          <div><Label className="text-xs">Priority</Label>
            <Select value={f.priority} onValueChange={v => set('priority', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label className="text-xs">Subject *</Label><Input value={f.subject} onChange={e => set('subject', e.target.value)} className="mt-1" required placeholder="e.g. CSR submission stuck" /></div>
        <div><Label className="text-xs">Message *</Label><Textarea value={f.body} onChange={e => set('body', e.target.value)} className="mt-1" rows={6} required placeholder="Describe your question or issue in detail…" /></div>
        <div className="flex items-center justify-between pt-2">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back to home</Link>
          <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Send ticket</>}</Button>
        </div>
      </form>
    </div>
  )
}
