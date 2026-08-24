import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import Link from 'next/link'
import { Package, TrendingUp, IndianRupee, Percent } from 'lucide-react'

async function isAdmin() {
  const c = await cookies()
  const token = c.get('gssl_admin')?.value
  if (!token) return false
  const secret = process.env.ADMIN_SECRET || 'dev-secret-change-me'
  const expected = crypto.createHmac('sha256', secret).update('admin-session-v1').digest('hex')
  try { return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex')) } catch { return false }
}

async function getStats() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  try {
    const res = await fetch(`${base}/api/products?limit=200`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    const items = data.items || []
    const total = items.length
    const featured = items.filter(p => p.featured).length
    const active = items.filter(p => p.active).length
    const totalRetail = items.reduce((s, p) => s + (p.price || 0), 0)
    const totalWholesale = items.reduce((s, p) => s + Math.round((p.wholesalePriceUsd || 0) * (p.usdToInr || 85)), 0)
    const totalMargin = totalRetail - totalWholesale
    const avgMargin = totalWholesale > 0 ? Math.round((totalMargin / totalWholesale) * 100) : 0
    return { total, featured, active, totalRetail, totalWholesale, totalMargin, avgMargin }
  } catch { return null }
}

const INR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)

export default async function AdminDashboard() {
  if (!(await isAdmin())) redirect('/admin/login')
  const stats = await getStats()
  const cards = [
    { label: 'Total Products', value: stats?.total ?? '—', icon: Package, color: 'from-blue-500 to-blue-600' },
    { label: 'Featured', value: stats?.featured ?? '—', icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
    { label: 'Avg. Margin', value: stats ? `${stats.avgMargin}%` : '—', icon: Percent, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Total Retail (INR)', value: stats ? INR(stats.totalRetail) : '—', icon: IndianRupee, color: 'from-purple-500 to-purple-600' },
  ]
  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back. Here&apos;s your catalog at a glance.</p>
        </div>
        <Link href="/admin/products" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Manage products</Link>
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow`}><Icon className="h-5 w-5" /></div>
              <div className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">{c.label}</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{c.value}</div>
            </div>
          )
        })}
      </div>
      {stats && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Profit projection (single sale of each product)</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><div className="text-slate-500">Retail total</div><div className="mt-1 text-xl font-bold text-slate-900">{INR(stats.totalRetail)}</div></div>
            <div><div className="text-slate-500">Wholesale total</div><div className="mt-1 text-xl font-bold text-slate-900">{INR(stats.totalWholesale)}</div></div>
            <div><div className="text-slate-500">Profit</div><div className="mt-1 text-xl font-bold text-emerald-600">{INR(stats.totalMargin)}</div></div>
          </div>
        </div>
      )}
    </div>
  )
}
