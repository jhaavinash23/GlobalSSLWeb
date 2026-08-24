'use client'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, Save, RefreshCw, Zap, Sparkles, ChevronRight, TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const INR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)
const round99 = (n) => Math.max(99, Math.round(Number(n) / 100) * 100 - 1)

const preview = ({ wholesalePriceUsd, msrpUsd, markup, priceOverride, usdToInr = 85 }) => {
  const w = Math.max(0, Number(wholesalePriceUsd) || 0)
  const m = Math.max(0, Number(msrpUsd) || 0)
  const mk = Math.max(1.01, Number(markup) || 1.7)
  const rate = Number(usdToInr) || 85
  const eff = w > 0 ? w : m * 0.15
  const computed = round99(eff * rate * mk)
  const retail = (priceOverride && Number(priceOverride) > 0) ? Math.round(Number(priceOverride)) : computed
  const original = Math.max(round99(m * rate), retail + 200)
  const wInr = Math.round(w * rate)
  const margin = Math.max(0, retail - wInr)
  const marginPct = wInr > 0 ? Math.round((margin / wInr) * 100) : 100
  return { retail, original, computed, wInr, margin, marginPct }
}

export default function ProductsEditor() {
  const [items, setItems] = useState([])
  const [brands, setBrands] = useState([])
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, bRes, cRes] = await Promise.all([
        fetch('/api/admin/products', { cache: 'no-store' }),
        fetch('/api/brands'),
        fetch('/api/categories'),
      ])
      if (!pRes.ok) throw new Error('Not authorised')
      const p = await pRes.json()
      setItems(p.items || [])
      const b = await bRes.json().catch(() => [])
      const c = await cRes.json().catch(() => [])
      setBrands(Array.isArray(b) ? b : [])
      setCats(Array.isArray(c) ? c : [])
    } catch (e) { toast.error(e.message || 'Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => items.filter(p => {
    if (brandFilter !== 'all' && p.brandSlug !== brandFilter) return false
    if (catFilter !== 'all' && p.categorySlug !== catFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!(p.name?.toLowerCase().includes(q) || p.brandName?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q))) return false
    }
    return true
  }), [items, brandFilter, catFilter, search])

  const stats = useMemo(() => {
    const total = items.length
    const retail = items.reduce((s, p) => s + (p.price || 0), 0)
    const cost = items.reduce((s, p) => s + Math.round((p.wholesalePriceUsd || 0) * (p.usdToInr || 85)), 0)
    const margin = retail - cost
    const pct = cost > 0 ? Math.round((margin / cost) * 100) : 0
    return { total, retail, cost, margin, pct }
  }, [items])

  const toggle = async (id, field, value) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(`${field} updated`)
    } catch (e) {
      toast.error(e.message || 'Save failed')
      load()
    }
  }

  const saveEdit = async () => {
    if (!editing) return
    const body = {
      msrpUsd: Number(editing.msrpUsd) || 0,
      wholesalePriceUsd: Number(editing.wholesalePriceUsd) || 0,
      markup: Number(editing.markup) || 1.7,
      priceOverride: editing.priceOverride === '' || editing.priceOverride == null ? null : Number(editing.priceOverride),
      name: editing.name,
      shortDescription: editing.shortDescription,
      featured: !!editing.featured,
      active: !!editing.active,
      warranty: editing.warranty,
      issuance: editing.issuance,
    }
    try {
      const res = await fetch(`/api/admin/products/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Save failed') }
      const updated = await res.json()
      setItems(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditing(null)
      toast.success('Product saved')
    } catch (e) { toast.error(e.message || 'Save failed') }
  }

  return (
    <div className="p-4 md:p-8 lg:p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Edit MSRP, wholesale, markup and pricing per product. Retail is re-computed automatically.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" />New product</Link></Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}><Sparkles className="mr-2 h-4 w-4" />Bulk markup</Button>
          <Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Reload</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Products</div><div className="mt-1 text-xl font-bold text-slate-900">{stats.total}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Total retail</div><div className="mt-1 text-xl font-bold text-slate-900">{INR(stats.retail)}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Total wholesale</div><div className="mt-1 text-xl font-bold text-slate-900">{INR(stats.cost)}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Avg margin</div><div className="mt-1 text-xl font-bold text-emerald-600">{stats.pct}% <span className="ml-1 text-sm font-medium text-slate-500">({INR(stats.margin)})</span></div></div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by product, brand or slug..." className="pl-9 h-10 bg-white" />
        </div>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="h-10 md:w-48 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands.map(b => <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-10 md:w-48 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {cats.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No products match those filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-right px-3 py-3">Wholesale $</th>
                  <th className="text-right px-3 py-3">MSRP $</th>
                  <th className="text-right px-3 py-3">Markup</th>
                  <th className="text-right px-3 py-3">Retail ₹</th>
                  <th className="text-right px-3 py-3">Margin</th>
                  <th className="text-center px-3 py-3">Featured</th>
                  <th className="text-center px-3 py-3">Active</th>
                  <th className="text-right px-4 py-3">Edit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const wInr = Math.round((p.wholesalePriceUsd || 0) * (p.usdToInr || 85))
                  const margin = Math.max(0, (p.price || 0) - wInr)
                  const marginPct = wInr > 0 ? Math.round((margin / wInr) * 100) : 100
                  return (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 leading-tight">{p.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">{p.validation}</span>
                          <span>{p.brandName}</span>
                          {p.wildcard && <span className="text-blue-600">· Wildcard</span>}
                          {p.multiDomain && <span className="text-blue-600">· Multi-Domain</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">${Number(p.wholesalePriceUsd || 0).toFixed(2)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">${Number(p.msrpUsd || 0).toFixed(0)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{Number(p.markup || 1.7).toFixed(2)}×</td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">{INR(p.price)}<div className="text-[10px] text-slate-400 line-through">{INR(p.originalPrice)}</div></td>
                      <td className="px-3 py-3 text-right tabular-nums"><span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', marginPct >= 70 ? 'bg-emerald-50 text-emerald-700' : marginPct >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>{marginPct}%</span><div className="text-[10px] text-slate-400 mt-0.5">{INR(margin)}</div></td>
                      <td className="px-3 py-3 text-center"><Switch checked={!!p.featured} onCheckedChange={v => toggle(p.id, 'featured', v)} /></td>
                      <td className="px-3 py-3 text-center"><Switch checked={!!p.active} onCheckedChange={v => toggle(p.id, 'active', v)} /></td>
                      <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => setEditing({ ...p, priceOverride: p.priceOverride ?? '' })}>Edit <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(v)=>!v && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>Update pricing, markup and metadata. Retail price recomputes automatically unless you set an override.</DialogDescription>
          </DialogHeader>
          {editing && (() => {
            const p = preview({ wholesalePriceUsd: editing.wholesalePriceUsd, msrpUsd: editing.msrpUsd, markup: editing.markup, priceOverride: editing.priceOverride, usdToInr: editing.usdToInr })
            const set = (k, v) => setEditing(e => ({ ...e, [k]: v }))
            return (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={editing.name || ''} onChange={e => set('name', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Short description</Label>
                  <Input value={editing.shortDescription || ''} onChange={e => set('shortDescription', e.target.value)} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Wholesale (USD)</Label>
                    <Input type="number" step="0.01" min="0" value={editing.wholesalePriceUsd ?? 0} onChange={e => set('wholesalePriceUsd', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">MSRP (USD)</Label>
                    <Input type="number" step="1" min="0" value={editing.msrpUsd ?? 0} onChange={e => set('msrpUsd', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Markup (× wholesale)</Label>
                    <Input type="number" step="0.05" min="1.01" value={editing.markup ?? 1.7} onChange={e => set('markup', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Retail override (INR)</Label>
                    <Input type="number" step="1" min="0" placeholder="Auto" value={editing.priceOverride ?? ''} onChange={e => set('priceOverride', e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Warranty</Label><Input value={editing.warranty || ''} onChange={e => set('warranty', e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs">Issuance</Label><Input value={editing.issuance || ''} onChange={e => set('issuance', e.target.value)} className="mt-1" /></div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={!!editing.featured} onCheckedChange={v => set('featured', v)} /> Featured</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={!!editing.active} onCheckedChange={v => set('active', v)} /> Active</label>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider"><TrendingUp className="h-3.5 w-3.5" />Live preview</div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><div className="text-[11px] text-slate-500">Retail (customer sees)</div><div className="font-bold text-slate-900 text-lg">{INR(p.retail)}</div><div className="text-[10px] text-slate-400 line-through">{INR(p.original)}</div></div>
                    <div><div className="text-[11px] text-slate-500">Wholesale cost</div><div className="font-semibold text-slate-900">{INR(p.wInr)}</div></div>
                    <div><div className="text-[11px] text-slate-500">Profit / sale</div><div className="font-bold text-emerald-600">{INR(p.margin)}</div></div>
                    <div><div className="text-[11px] text-slate-500">Margin</div><div className={cn('font-bold', p.marginPct >= 70 ? 'text-emerald-600' : p.marginPct >= 40 ? 'text-amber-600' : 'text-red-600')}>{p.marginPct}%</div></div>
                  </div>
                  {editing.priceOverride && Number(editing.priceOverride) > 0 && (
                    <div className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">Override active — retail bypasses the markup formula. Auto-computed would be {INR(p.computed)}.</div>
                  )}
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}><Save className="mr-2 h-4 w-4" />Save product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkMarkup open={bulkOpen} setOpen={setBulkOpen} brands={brands} cats={cats} onDone={load} />
    </div>
  )
}

function BulkMarkup({ open, setOpen, brands, cats, onDone }) {
  const [scope, setScope] = useState('all')
  const [brand, setBrand] = useState('')
  const [cat, setCat] = useState('')
  const [validation, setValidation] = useState('')
  const [markup, setMarkup] = useState('1.7')
  const [saving, setSaving] = useState(false)

  const apply = async () => {
    setSaving(true)
    try {
      const body = { markup: Number(markup) }
      if (scope === 'brand') body.brandSlug = brand
      if (scope === 'category') body.categorySlug = cat
      if (scope === 'validation') body.validation = validation
      const res = await fetch('/api/admin/products/bulk-markup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Bulk update failed')
      const d = await res.json()
      toast.success(`Updated ${d.updated} product${d.updated === 1 ? '' : 's'}`)
      setOpen(false)
      onDone?.()
    } catch (e) { toast.error(e.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk markup update</DialogTitle>
          <DialogDescription>Apply a new markup multiplier to a whole segment of products. Retail prices recompute automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Scope</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                <SelectItem value="brand">By brand</SelectItem>
                <SelectItem value="category">By category</SelectItem>
                <SelectItem value="validation">By validation (DV/OV/EV)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {scope === 'brand' && (
            <div><Label className="text-xs">Brand</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>{brands.map(b => <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {scope === 'category' && (
            <div><Label className="text-xs">Category</Label>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{cats.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {scope === 'validation' && (
            <div><Label className="text-xs">Validation</Label>
              <Select value={validation} onValueChange={setValidation}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select validation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DV">DV</SelectItem><SelectItem value="OV">OV</SelectItem><SelectItem value="EV">EV</SelectItem><SelectItem value="IV">IV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">New markup (×)</Label>
            <Input type="number" step="0.05" min="1.01" value={markup} onChange={e=>setMarkup(e.target.value)} className="mt-1" />
            <p className="mt-1 text-[11px] text-slate-500">Retail = wholesale × ₹85 × markup, rounded to ₹...99. Products with a retail override are skipped.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={apply} disabled={saving || !markup}><Zap className="mr-2 h-4 w-4" />Apply markup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
