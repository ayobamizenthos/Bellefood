import OrderDetailScreen from './OrderDetailScreen'

export default function Page({ params }: { params: { orderId: string } }) {
  return <OrderDetailScreen orderId={params.orderId} />
}
