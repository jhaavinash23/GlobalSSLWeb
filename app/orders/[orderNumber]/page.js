import OrderTracking from './order-tracking'

export const metadata = { title: 'Order tracking' }

export default async function Page({ params, searchParams }) {
  const { orderNumber } = await params
  const sp = await searchParams
  return <OrderTracking orderNumber={orderNumber} emailParam={sp?.email || ''} isNew={sp?.new === '1'} />
}
