'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const INR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)
const round99 = (n) => Math.max(99, Math.round(Number(n) / 100) * 100 - 1)
const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function NewProductForm() {
  const router = useRouter()
  const [brands, setBrands] = useState([])
  const [cats, setCats] = useState([])
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState({
    name: '', slug: '', shortDescription: '', description: '',
    brandSlug: '', categorySlug: '', validation: 'DV',
    wholesalePriceUsd: '0', msrpUsd: '0', markup: '2.0', priceOverride: '', usdToInr: 85,
    warranty: '₹10,000', issuance: '5 minutes', encryption: '256-bit',
    wildcard: false, multiDomain: false, featured: false, active: true,
    features: 'Free unlimited reissues\n99.9% browser compatibility\n30-day money-back guarantee',
    browsers: 'Chrome, Firefox, Safari, Edge, iOS, Android',
  })

  useEffect(() => {
    fetch('/api/brands').then(r => r.json()).then(d => Array.isArray(d) && setBrands(d)).catch(() => {})
    fetch('/api/categories').then(r => r.json()).then(d => Array.isArray(d) && setCats(d)).catch(() => {})
  }, [])

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const preview = useMemo(() => {
    const w = Math.max(0, Number(f.wholesalePriceUsd) || 0)
    const m = Math.max(0, Number(f.msrpUsd) || 0)
    const mk = Math.max(1.01, Number(f.markup) || 1.7)
    const rate = Number(f.usdToInr) || 85
    const eff = w > 0 ? w : m * 0.15
    const computed = round99(eff * rate * mk)
    const retail = (f.priceOverride && Number(f.priceOverride) > 0) ? Math.round(Number(f.priceOverride)) : computed
    const original = Math.max(round99(m * rate), retail + 200)
    const wInr = Math.round(w * rate)
    const margin = Math.max(0, retail - wInr)
    const marginPct = wInr > 0 ? Math.round((margin / wInr) * 100) : 100
    return { retail, original, wInr, margin, marginPct, computed }
  }, [f])

  const submit = async (e) => {
    e.preventDefault()
    if (!f.name || !f.brandSlug || !f.categorySlug || !f.validation) {
      toast.error('Please fill name, brand, category and validation')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...f,
        slug: f.slug || slugify(f.name),
        wholesalePriceUsd: Number(f.wholesalePriceUsd) || 0,
        msrpUsd: Number(f.msrpUsd) || 0,
        markup: Number(f.markup) || 1.7,
        priceOverride: f.priceOverride === '' ? null : Number(f.priceOverride),
        usdToInr: Number(f.usdToInr) || 85,
        features: f.features.split(/\n|,/).map(s => s.trim()).filter(Boolean),
        browsers: f.browsers.split(/\n|,/).map(s => s.trim()).filter(Boolean),
      }
      const res = await fetch('/api/admin/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Create failed') }
      toast.success('Product created!')
      router.push('/admin/products')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/admin/products" className="hover:text-slate-900"><ArrowLeft className="inline h-4 w-4 mr-1" />Back to products</Link>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">New product</h1>
      <p className="mt-1 text-sm text-slate-500">Create a brand-new SSL SKU. Retail price auto-computes from wholesale × ₹85 × markup.</p>

      <form onSubmit={submit} className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Basic details</h2>
            <div><Label className="text-xs">Product name *</Label><Input value={f.name} onChange={e => set('name', e.target.value)} onBlur={() => !f.slug && set('slug', slugify(f.name))} className="mt-1" placeholder="Sectigo PositiveSSL DV" required /></div>
            <div><Label className="text-xs">Slug (URL)</Label><Input value={f.slug} onChange={e => set('slug', slugify(e.target.value))} className="mt-1 font-mono" placeholder="auto-from-name" /></div>
            <div><Label className="text-xs">Short description</Label><Input value={f.shortDescription} onChange={e => set('shortDescription', e.target.value)} className="mt-1" placeholder="Instant domain validated SSL from Sectigo." /></div>
            <div><Label className="text-xs">Long description</Label><Textarea value={f.description} onChange={e => set('description', e.target.value)} className="mt-1" rows={4} placeholder="Full marketing description shown on the product detail page..." /></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Classification</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label className="text-xs">Brand *</Label>
                <Select value={f.brandSlug} onValueChange={v => set('brandSlug', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>{brands.map(b => <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Category *</Label>
                <Select value={f.categorySlug} onValueChange={v => set('categorySlug', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{cats.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Validation *</Label>
                <Select value={f.validation} onValueChange={v => set('validation', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DV">DV — Domain Validated</SelectItem>
                    <SelectItem value="OV">OV — Organization Validated</SelectItem>
                    <SelectItem value="EV">EV — Extended Validation</SelectItem>
                    <SelectItem value="IV">IV — Individual Validated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.wildcard} onCheckedChange={v => set('wildcard', v)} /> Wildcard</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.multiDomain} onCheckedChange={v => set('multiDomain', v)} /> Multi-Domain</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.featured} onCheckedChange={v => set('featured', v)} /> Featured on homepage</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.active} onCheckedChange={v => set('active', v)} /> Active (visible in shop)</label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Pricing</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className="text-xs">Wholesale ($)</Label><Input type="number" step="0.01" min="0" value={f.wholesalePriceUsd} onChange={e => set('wholesalePriceUsd', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">MSRP ($)</Label><Input type="number" step="1" min="0" value={f.msrpUsd} onChange={e => set('msrpUsd', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Markup (×)</Label><Input type="number" step="0.05" min="1.01" value={f.markup} onChange={e => set('markup', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Retail override (₹)</Label><Input type="number" step="1" min="0" placeholder="Auto" value={f.priceOverride} onChange={e => set('priceOverride', e.target.value)} className="mt-1" /></div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Specifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><Label className="text-xs">Warranty</Label><Input value={f.warranty} onChange={e => set('warranty', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Issuance</Label><Input value={f.issuance} onChange={e => set('issuance', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Encryption</Label><Input value={f.encryption} onChange={e => set('encryption', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label className="text-xs">Features (one per line or comma-separated)</Label><Textarea value={f.features} onChange={e => set('features', e.target.value)} className="mt-1" rows={4} /></div>
            <div><Label className="text-xs">Browser compatibility (comma-separated)</Label><Input value={f.browsers} onChange={e => set('browsers', e.target.value)} className="mt-1" /></div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 h-fit space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider"><TrendingUp className="h-3.5 w-3.5" />Live preview</div>
            <div className="mt-4 space-y-3">
              <div><div className="text-[11px] text-slate-500">Retail (customer sees)</div><div className="text-2xl font-bold text-slate-900">{INR(preview.retail)}</div><div className="text-[11px] text-slate-400 line-through">{INR(preview.original)}</div></div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                <div><div className="text-[10px] text-slate-500">Wholesale</div><div className="font-semibold text-slate-900 text-sm">{INR(preview.wInr)}</div></div>
                <div><div className="text-[10px] text-slate-500">Profit</div><div className="font-bold text-emerald-600 text-sm">{INR(preview.margin)}</div></div>
                <div><div className="text-[10px] text-slate-500">Margin</div><div className={cn('font-bold text-sm', preview.marginPct >= 70 ? 'text-emerald-600' : preview.marginPct >= 40 ? 'text-amber-600' : 'text-red-600')}>{preview.marginPct}%</div></div>
              </div>
              {f.priceOverride && Number(f.priceOverride) > 0 && (
                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">Override active. Auto-computed would be {INR(preview.computed)}.</div>
              )}
            </div>
          </div>
          <Button type="submit" className="w-full h-11" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" />Create product</>}
          </Button>
        </aside>
      </form>
    </div>
  )
}
