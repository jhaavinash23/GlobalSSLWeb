'use client'
import Link from 'next/link'
import { ShieldCheck, Zap, Award, Globe, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart'
import { formatINR, pct } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const validationBadge = (v) => {
  const map = {
    DV: { label: 'DV', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
    OV: { label: 'OV', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    EV: { label: 'EV', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    IV: { label: 'IV', cls: 'bg-purple-50 text-purple-700 border-purple-100' },
  }
  return map[v] || map.DV
}

export default function ProductCard({ product }) {
  const addItem = useCart(s => s.addItem)
  const badge = validationBadge(product.validation)
  const discount = pct(product.price, product.originalPrice)
  return (
    <div className="group card-elevated flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(37,99,235,0.18)]">
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold', badge.cls)}>{badge.label}</span>
            <span className="text-xs font-medium text-slate-500">{product.brandName}</span>
          </div>
          {discount > 0 && (
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">-{discount}%</span>
          )}
        </div>
        <Link href={`/ssl-certificates/${product.slug}`} className="mt-3 block">
          <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-blue-700 leading-snug">{product.name}</h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-[13px] text-slate-600 min-h-[40px]">{product.shortDescription}</p>
      </div>
      <div className="px-5 pb-4 space-y-2">
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-slate-600"><Zap className="h-3 w-3" />{product.issuance}</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-slate-600"><Award className="h-3 w-3" />{product.warranty}</span>
          {product.wildcard && <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-700"><Globe className="h-3 w-3" />Wildcard</span>}
          {product.multiDomain && <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-700"><Globe className="h-3 w-3" />Multi-domain</span>}
        </div>
      </div>
      <div className="mt-auto border-t border-slate-100 p-5 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-500">Starting at</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900">{formatINR(product.price)}</span>
              {product.originalPrice > product.price && <span className="text-xs text-slate-400 line-through">{formatINR(product.originalPrice)}</span>}
            </div>
            <div className="text-[10px] text-slate-500">/year · excl. GST</div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Button size="sm" onClick={() => { addItem(product); toast.success('Added to cart', { description: product.name }) }}>Add to cart</Button>
            <Link href={`/ssl-certificates/${product.slug}`} className="text-center text-[11px] font-medium text-slate-500 hover:text-blue-700">Details →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
