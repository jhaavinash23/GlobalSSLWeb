import TicketThread from './ticket-thread'
export const metadata = { title: 'Support ticket' }
export default async function Page({ params, searchParams }) {
  const { ticketNumber } = await params
  const sp = await searchParams
  return <TicketThread ticketNumber={ticketNumber} emailParam={sp?.email || ''} />
}
