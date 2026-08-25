'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, RefreshCw, Search, LifeBuoy, ChevronRight, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const STATUS_COLORS = { OPEN: 'bg-blue-50 text-blue-700', IN_PROGRESS: 'bg-amber-50 text-amber-700', RESOLVED: 'bg-emerald-50 text-emerald-700', CLOSED: 'bg-slate-100 text-slate-700' }
const PRIO_COLORS = { low: 'bg-slate-100 text-slate-700', normal: 'bg-slate-100 text-slate-700', high: 'bg-orange-50 text-orange-700', urgent: 'bg-red-50 text-red-700' }

export default function TicketsList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const url = status === 'all' ? '/api/admin/tickets' : `/api/admin/tickets?status=${status}`
      const d = await fetch(url, { cache: 'no-store' }).then(r => r.json())
      setItems(d.items || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [status])

  const filtered = useMemo(() => items.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.subject?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.ticketNumber?.toLowerCase().includes(q) || t.orderNumber?.toLowerCase().includes(q)
  }), [items, search])

  const counts = useMemo(() => ({
    open: items.filter(t => t.status === 'OPEN').length,
    inProgress: items.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: items.filter(t => t.status === 'RESOLVED').length,
  }), [items])

  return (
    <div className="p-4 md:p-8 lg:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Support inbox</h1>
          <p className="mt-1 text-sm text-slate-500">Every question from customers lands here. Reply to keep tickets moving.</p>
        </div>
        <Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Reload</Button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Open" value={counts.open} color="bg-blue-500" />
        <Stat label="In progress" value={counts.inProgress} color="bg-amber-500" />
        <Stat label="Resolved" value={counts.resolved} color="bg-emerald-500" />
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticket #, subject, customer, order..." className="pl-9 h-10 bg-white" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 md:w-56 bg-white"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center"><LifeBuoy className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm text-slate-500">No tickets match those filters.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(t => (
              <Link key={t.id} href={`/admin/tickets/${t.ticketNumber}`} className="flex items-start gap-3 px-4 py-4 hover:bg-slate-50/50">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white text-xs font-semibold shrink-0">{t.name?.[0]?.toUpperCase() || 'U'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">{t.ticketNumber}</span>
                    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold', STATUS_COLORS[t.status] || 'bg-slate-100')}>{(t.status || '').replace(/_/g,' ')}</span>
                    {t.priority !== 'normal' && <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase', PRIO_COLORS[t.priority] || 'bg-slate-100')}>{t.priority}</span>}
                    {t.orderNumber && <span className="text-[11px] font-mono text-slate-500">· {t.orderNumber}</span>}
                    <span className="ml-auto text-[11px] text-slate-500">{new Date(t.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="mt-1 font-semibold text-slate-900 line-clamp-1">{t.subject}</div>
                  <div className="mt-0.5 text-[12px] text-slate-500 line-clamp-1"><b>{t.name}</b> ({t.email}) · {t.messages?.[t.messages.length - 1]?.body}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 mt-2 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500"><span className={cn('h-2 w-2 rounded-full', color)} />{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  )
}
