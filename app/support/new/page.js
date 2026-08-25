import { Suspense } from 'react'
import NewTicketForm from './new-ticket-form'
export const metadata = { title: 'Contact support' }
export default function Page() {
  return <Suspense fallback={<div className="container-x py-16">Loading…</div>}><NewTicketForm /></Suspense>
}
