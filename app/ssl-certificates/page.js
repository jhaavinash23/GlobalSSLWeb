import { Suspense } from 'react'
import MarketplaceClient from './marketplace-client'

export const metadata = { title: 'SSL Certificates — Marketplace', description: 'Browse SSL certificates from top authorities.' }

export default function Page() {
  return (
    <Suspense fallback={<div className="container-x py-12">Loading…</div>}>
      <MarketplaceClient />
    </Suspense>
  )
}
