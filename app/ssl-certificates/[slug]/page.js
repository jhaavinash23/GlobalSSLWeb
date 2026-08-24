import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductDetailClient from './detail-client'

async function getProduct(slug) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || ''
    const res = await fetch(`${base}/api/products/slug/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const data = await getProduct(slug)
  if (!data?.product) return { title: 'Certificate not found' }
  const p = data.product
  return {
    title: `${p.name} — ${p.brandName}`,
    description: p.shortDescription || p.description?.slice(0, 160),
  }
}

export default async function Page({ params }) {
  const { slug } = await params
  const data = await getProduct(slug)
  if (!data?.product) return notFound()
  return <ProductDetailClient data={data} />
}
