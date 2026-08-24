'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ChevronRight, ClipboardList, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const INR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)

const STATUS_COLORS = {
  CREATED: 'bg-slate-100 text-slate-700',
  PAID: 'bg-blue-50 text-blue-700',
  CSR_SUBMITTED: 'bg-indigo-50 text-indigo-700',
  DCV_INSTRUCTIONS: 'bg-amber-50 text-amber-700',
  DCV_COMPLETED: 'bg-purple-50 text-purple-700',
  ISSUED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
}

const PAY_COLORS = {
  PENDING: 'bg-amber-50 text-amber-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  REFUNDED: 'bg-slate-100 text-slate-700',
  FAILED: 'bg-red-50 text-red-700',
}

export default function OrdersList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' })
      const d = await res.json()
      setItems(d.items || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="p-4 md:p-8 lg:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Process orders, review CSRs, post DCV instructions and upload issued certificates.</p>
        </div>
        <Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Reload</Button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No orders yet</h3>
            <p className="mt-1 text-sm text-slate-500">Once customers place orders they&apos;ll appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Order</th>
                  <th className="text-left px-3 py-3">Customer</th>
                  <th className="text-left px-3 py-3">Products</th>
                  <th className="text-right px-3 py-3">Total</th>
                  <th className="text-center px-3 py-3">Payment</th>
                  <th className="text-center px-3 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(o => (
                  <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/40">
                    <td className="px-4 py-3">
                      <div className="font-mono text-[13px] font-semibold text-slate-900">{o.orderNumber}</div>
                      <div className="text-[11px] text-slate-500">{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900 text-[13px]">{o.customer?.name}</div>
                      <div className="text-[11px] text-slate-500">{o.customer?.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-[13px] text-slate-700 line-clamp-1">{o.items.map(i => i.name).join(', ')}</div>
                      <div className="text-[11px] text-slate-500">{o.items.length} item{o.items.length === 1 ? '' : 's'}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold">{INR(o.total)}</td>
                    <td className="px-3 py-3 text-center"><span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold', PAY_COLORS[o.paymentStatus] || PAY_COLORS.PENDING)}>{o.paymentStatus}</span></td>
                    <td className="px-3 py-3 text-center"><span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold', STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-700')}>{(o.status || '').replace(/_/g,' ')}</span></td>
                    <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" asChild><Link href={`/admin/orders/${o.orderNumber}`}>Manage <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
