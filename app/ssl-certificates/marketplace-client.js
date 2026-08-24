'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ProductCard from '@/components/site/product-card'
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const VALIDATIONS = [{k:'DV',l:'Domain Validated'},{k:'OV',l:'Organization Validated'},{k:'EV',l:'Extended Validation'},{k:'IV',l:'Individual Validated'}]

export default function MarketplaceClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: sp.get('search') || '',
    brand: sp.get('brand') || '',
    category: sp.get('category') || '',
    validation: sp.get('validation') || '',
    wildcard: sp.get('wildcard') === 'true',
    multiDomain: sp.get('multiDomain') === 'true',
    featured: sp.get('featured') === 'true',
    sort: sp.get('sort') || 'featured',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { fetch('/api/brands').then(r => r.json()).then(setBrands).catch(() => setBrands([])) }, [])

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== false && v !== '') p.set(k, v) })
    return p.toString()
  }, [filters])

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetch(`/api/products?${qs}`).then(r => r.json()).then(d => {
      if (!alive) return
      setProducts(d.items || [])
      setTotal(d.total || 0)
      setLoading(false)
    }).catch(() => alive && setLoading(false))
    return () => { alive = false }
  }, [qs])

  const update = (patch) => setFilters(f => ({ ...f, ...patch }))
  const clearAll = () => setFilters({ search: '', brand: '', category: '', validation: '', wildcard: false, multiDomain: false, featured: false, sort: 'featured' })

  const activeCount = ['brand','category','validation'].filter(k=>filters[k]).length + (filters.wildcard?1:0) + (filters.multiDomain?1:0) + (filters.featured?1:0)

  return (
    <div className="container-x py-8 md:py-12">
      <div className="flex flex-col gap-2">
        <nav className="text-xs text-slate-500"><a href="/" className="hover:text-slate-900">Home</a> <span className="mx-2">/</span> <span className="text-slate-700">SSL Certificates</span></nav>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">SSL Certificate Marketplace</h1>
        <p className="text-slate-600 max-w-2xl">Browse premium SSL certificates from the world’s most trusted authorities. Filter by brand, validation type, and features.</p>
      </div>

      {/* Search + sort bar */}
      <div className="mt-8 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={filters.search} onChange={e=>update({search:e.target.value})} placeholder="Search by name, brand, validation…" className="pl-9 h-11 bg-white" />
        </div>
        <Select value={filters.sort} onValueChange={v=>update({sort:v})}>
          <SelectTrigger className="h-11 md:w-56 bg-white"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="h-11 md:hidden" onClick={()=>setShowFilters(true)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters{activeCount>0 && <span className="ml-1 rounded-full bg-blue-600 px-1.5 text-[10px] text-white">{activeCount}</span>}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* SIDEBAR FILTERS */}
        <aside className={cn('lg:block', showFilters ? 'fixed inset-0 z-50 bg-white overflow-y-auto p-6' : 'hidden')}>
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h3 className="text-base font-semibold">Filters</h3>
            <button onClick={()=>setShowFilters(false)}><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-6 lg:sticky lg:top-24">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
                {activeCount > 0 && <button onClick={clearAll} className="text-xs text-blue-600 hover:underline">Clear all</button>}
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox checked={filters.featured} onCheckedChange={v=>update({featured:!!v})} /> Featured only
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox checked={filters.wildcard} onCheckedChange={v=>update({wildcard:!!v})} /> Wildcard
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox checked={filters.multiDomain} onCheckedChange={v=>update({multiDomain:!!v})} /> Multi-domain
                </label>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Validation</h4>
              <div className="space-y-2">
                <button onClick={()=>update({validation:''})} className={cn('block w-full text-left text-sm rounded-md px-2 py-1.5', !filters.validation?'bg-blue-50 text-blue-700 font-medium':'text-slate-600 hover:bg-slate-50')}>All</button>
                {VALIDATIONS.map(v => (
                  <button key={v.k} onClick={()=>update({validation:v.k})} className={cn('block w-full text-left text-sm rounded-md px-2 py-1.5', filters.validation===v.k?'bg-blue-50 text-blue-700 font-medium':'text-slate-600 hover:bg-slate-50')}>
                    <span className="font-semibold mr-2">{v.k}</span><span className="text-slate-500 text-xs">{v.l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Brand</h4>
              <div className="space-y-2">
                <button onClick={()=>update({brand:''})} className={cn('block w-full text-left text-sm rounded-md px-2 py-1.5', !filters.brand?'bg-blue-50 text-blue-700 font-medium':'text-slate-600 hover:bg-slate-50')}>All brands</button>
                {brands.map(b => (
                  <button key={b.slug} onClick={()=>update({brand:b.slug})} className={cn('block w-full text-left text-sm rounded-md px-2 py-1.5', filters.brand===b.slug?'bg-blue-50 text-blue-700 font-medium':'text-slate-600 hover:bg-slate-50')}>
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:hidden mt-6 flex gap-2">
            <Button className="flex-1" onClick={()=>setShowFilters(false)}>Show {total} results</Button>
          </div>
        </aside>

        {/* RESULTS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">{loading ? 'Loading…' : `Showing ${products.length} of ${total} certificate${total===1?'':'s'}`}</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({length:6}).map((_,i)=>(
                <div key={i} className="card-elevated p-6 h-64 animate-pulse"><div className="h-4 w-20 bg-slate-100 rounded mb-4" /><div className="h-6 w-3/4 bg-slate-100 rounded mb-3" /><div className="h-4 w-full bg-slate-100 rounded mb-2" /><div className="h-4 w-2/3 bg-slate-100 rounded" /></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card-elevated p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No certificates match your filters</h3>
              <p className="mt-2 text-sm text-slate-600">Try adjusting your search or clearing filters.</p>
              <Button onClick={clearAll} className="mt-4">Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
