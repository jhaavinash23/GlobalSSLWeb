'use client'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, Users, Search, KeyRound, Save, Copy, RefreshCw, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const INR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)

export default function UsersManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [tempPw, setTempPw] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const d = await res.json()
      setItems(d.items || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => items.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q) || u.company?.toLowerCase().includes(q)
  }), [items, search])

  const saveEdit = async () => {
    if (!editing) return
    try {
      const res = await fetch(`/api/admin/users/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editing.name, email: editing.email, phone: editing.phone, company: editing.company, status: editing.status }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      setItems(prev => prev.map(u => u.id === d.id ? { ...u, ...d } : u))
      toast.success('User updated')
      setEditing(null)
    } catch (e) { toast.error(e.message) }
  }

  const resetPw = async () => {
    if (!editing) return
    if (!confirm(`Reset password for ${editing.email}? A temporary password will be emailed to them.`)) return
    try {
      const res = await fetch(`/api/admin/users/${editing.id}/reset-password`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      setTempPw(d.tempPassword)
      toast.success('Password reset — temp password emailed')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="p-4 md:p-8 lg:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">View customer accounts, help with support, reset passwords and update details.</p>
        </div>
        <Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Reload</Button>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total users" value={items.length} />
        <Stat label="Active" value={items.filter(u => u.status !== 'disabled').length} />
        <Stat label="Total spend" value={INR(items.reduce((s, u) => s + (u.totalSpend || 0), 0))} />
        <Stat label="Total orders" value={items.reduce((s, u) => s + (u.orderCount || 0), 0)} />
      </div>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone, company..." className="pl-9 h-10 bg-white" />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center"><Users className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm text-slate-500">No users match those filters.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider"><tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-3 py-3">Contact</th>
                <th className="text-right px-3 py-3">Orders</th>
                <th className="text-right px-3 py-3">Spend</th>
                <th className="text-center px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Registered</th>
                <th className="text-right px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white text-xs font-semibold">{u.name?.[0]?.toUpperCase() || 'U'}</div>
                        <div>
                          <div className="font-medium text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.company || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><div className="text-[13px]">{u.email}</div><div className="text-[11px] text-slate-500">{u.phone || '—'}</div></td>
                    <td className="px-3 py-3 text-right tabular-nums">{u.orderCount || 0}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold">{INR(u.totalSpend)}</td>
                    <td className="px-3 py-3 text-center"><span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold', u.status === 'disabled' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}>{u.status || 'active'}</span></td>
                    <td className="px-3 py-3 text-[11px] text-slate-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => setEditing({ ...u })}>Manage</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={v => !v && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Manage user</DialogTitle><DialogDescription>Update contact info, change email, disable account, or reset password. The user is emailed for password resets.</DialogDescription></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label className="text-xs">Full name</Label><Input value={editing.name || ''} onChange={e => setEditing(u => ({ ...u, name: e.target.value }))} className="mt-1" /></div>
                <div><Label className="text-xs">Email</Label><Input type="email" value={editing.email || ''} onChange={e => setEditing(u => ({ ...u, email: e.target.value.toLowerCase() }))} className="mt-1" /></div>
                <div><Label className="text-xs">Phone</Label><Input value={editing.phone || ''} onChange={e => setEditing(u => ({ ...u, phone: e.target.value }))} className="mt-1" /></div>
                <div><Label className="text-xs">Company</Label><Input value={editing.company || ''} onChange={e => setEditing(u => ({ ...u, company: e.target.value }))} className="mt-1" /></div>
              </div>
              <div>
                <Label className="text-xs">Account status</Label>
                <Select value={editing.status || 'active'} onValueChange={v => setEditing(u => ({ ...u, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="disabled">Disabled — user cannot sign in</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900"><KeyRound className="h-4 w-4" />Password support</div>
                <p className="mt-1 text-xs text-amber-800">Generate a temporary password and email it to the user. They can sign in with it and then change it from their account.</p>
                <Button size="sm" variant="outline" onClick={resetPw} className="mt-3 border-amber-300"><Mail className="mr-2 h-3.5 w-3.5" />Reset & email temp password</Button>
                {tempPw && (
                  <div className="mt-3 rounded-md border border-slate-200 bg-white p-2.5 text-xs">
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider">Temp password (also emailed)</div>
                    <div className="mt-1 font-mono text-sm font-semibold flex items-center justify-between">{tempPw} <button onClick={() => { navigator.clipboard.writeText(tempPw); toast.success('Copied') }} className="text-blue-600"><Copy className="h-3.5 w-3.5" /></button></div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}><Save className="mr-2 h-4 w-4" />Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 text-xl font-bold text-slate-900">{value}</div></div>
}
