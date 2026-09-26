import OrderDetailScreen from './OrderDetailScreen'

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  return <OrderDetailScreen orderId={orderId} />
}
