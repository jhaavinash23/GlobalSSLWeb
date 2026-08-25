'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, ShoppingBag, KeyRound, LogOut, Loader2, ExternalLink, ShieldCheck, Package } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const INR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)
const STATUS_COLORS = { CREATED: 'bg-slate-100 text-slate-700', PAID: 'bg-blue-50 text-blue-700', CSR_SUBMITTED: 'bg-indigo-50 text-indigo-700', DCV_INSTRUCTIONS: 'bg-amber-50 text-amber-700', DCV_COMPLETED: 'bg-purple-50 text-purple-700', ISSUED: 'bg-emerald-50 text-emerald-700', CANCELLED: 'bg-red-50 text-red-700' }

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('orders')

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/auth/me').then(r => r.json()).catch(() => ({}))
      if (!me?.user) { router.push('/login'); return }
      setUser(me.user)
      const o = await fetch('/api/account/orders', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
      setOrders(o.items || [])
      setLoading(false)
    })()
  }, [router])

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); toast.success('Signed out'); router.push('/') }

  if (loading || !user) return <div className="container-x py-16 text-center text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading...</div>

  const issuedCerts = orders.flatMap(o => o.items.filter(i => i.fulfillment?.certificate).map((i, idx) => ({ order: o, item: i, idx: o.items.indexOf(i) })))

  return (
    <div className="container-x py-8 md:py-12">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card-elevated p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Total orders</div><div className="mt-1 text-2xl font-bold">{orders.length}</div></div>
        <div className="card-elevated p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Active certificates</div><div className="mt-1 text-2xl font-bold text-emerald-600">{issuedCerts.length}</div></div>
        <div className="card-elevated p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Total spend</div><div className="mt-1 text-2xl font-bold">{INR(orders.reduce((s, o) => s + o.total, 0))}</div></div>
      </div>

      <div className="border-b border-slate-200 flex gap-6">
        {[{k:'orders',l:'Orders',i:ShoppingBag},{k:'certs',l:'My certificates',i:ShieldCheck},{k:'profile',l:'Profile & security',i:User}].map(t => {
          const I = t.i
          return <button key={t.k} onClick={() => setTab(t.k)} className={cn('py-3 -mb-px inline-flex items-center gap-2 text-sm font-medium border-b-2', tab === t.k ? 'text-blue-700 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-900')}><I className="h-4 w-4" />{t.l}</button>
        })}
      </div>

      <div className="mt-6">
        {tab === 'orders' && (
          <div className="card-elevated overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center"><Package className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm text-slate-500">You don&apos;t have any orders yet.</p><Button asChild className="mt-4"><Link href="/ssl-certificates">Browse certificates</Link></Button></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider"><tr><th className="text-left px-4 py-3">Order</th><th className="text-left px-3 py-3">Products</th><th className="text-right px-3 py-3">Total</th><th className="text-center px-3 py-3">Status</th><th className="text-right px-4 py-3"></th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-slate-100">
                      <td className="px-4 py-3"><div className="font-mono text-[12px] font-semibold">{o.orderNumber}</div><div className="text-[11px] text-slate-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</div></td>
                      <td className="px-3 py-3"><div className="text-slate-700 line-clamp-1 max-w-md">{o.items.map(i => i.name).join(', ')}</div></td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold">{INR(o.total)}</td>
                      <td className="px-3 py-3 text-center"><span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold', STATUS_COLORS[o.status] || 'bg-slate-100')}>{(o.status || '').replace(/_/g, ' ')}</span></td>
                      <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" asChild><Link href={`/orders/${o.orderNumber}?email=${encodeURIComponent(user.email)}`}>Manage <ExternalLink className="ml-1 h-3 w-3" /></Link></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'certs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issuedCerts.length === 0 ? (
              <div className="col-span-2 card-elevated p-12 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm text-slate-500">No issued certificates yet. Once we issue your first cert, download links will appear here.</p></div>
            ) : issuedCerts.map(({ order, item, idx }, k) => (
              <div key={k} className="card-elevated p-5">
                <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Issued</div>
                <div className="mt-1 font-bold text-slate-900">{item.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Order {order.orderNumber} · Expires {item.fulfillment?.expiresAt ? new Date(item.fulfillment.expiresAt).toLocaleDateString('en-IN') : '—'}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" asChild><a href={`/api/orders/${order.orderNumber}/items/${idx}/download?kind=cert&email=${encodeURIComponent(user.email)}`}>Certificate</a></Button>
                  <Button size="sm" variant="outline" asChild><a href={`/api/orders/${order.orderNumber}/items/${idx}/download?kind=bundle&email=${encodeURIComponent(user.email)}`}>Full bundle</a></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'profile' && <ProfileForm user={user} onUpdate={setUser} />}
      </div>
    </div>
  )
}

function ProfileForm({ user, onUpdate }) {
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', company: user.company || '', currentPassword: '', newPassword: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      onUpdate({ ...user, name: f.name, phone: f.phone, company: f.company })
      setF(p => ({ ...p, currentPassword: '', newPassword: '' }))
      toast.success('Profile updated')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }
  return (
    <form onSubmit={save} className="card-elevated p-6 max-w-xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label className="text-xs">Full name</Label><Input value={f.name} onChange={e => set('name', e.target.value)} className="mt-1" /></div>
        <div><Label className="text-xs">Email</Label><Input value={user.email} readOnly className="mt-1 bg-slate-50" /></div>
        <div><Label className="text-xs">Phone</Label><Input value={f.phone} onChange={e => set('phone', e.target.value)} className="mt-1" /></div>
        <div><Label className="text-xs">Company</Label><Input value={f.company} onChange={e => set('company', e.target.value)} className="mt-1" /></div>
      </div>
      <div className="pt-4 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" />Change password</div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Current password</Label><Input type="password" value={f.currentPassword} onChange={e => set('currentPassword', e.target.value)} className="mt-1" /></div>
          <div><Label className="text-xs">New password (min 6)</Label><Input type="password" value={f.newPassword} onChange={e => set('newPassword', e.target.value)} className="mt-1" minLength={6} /></div>
        </div>
      </div>
      <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}</Button>
    </form>
  )
}
