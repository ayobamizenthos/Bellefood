import type { Metadata } from 'next'
import { AuthGate } from '@/components/auth/AuthGate'
import OrdersScreen from './OrdersScreen'

export const metadata: Metadata = {
  title: 'Your Orders',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AuthGate
      title="Sign in to see your orders"
      message="Track your Belle Food orders from the kitchen to your door. Sign in to see your order history and live status."
    >
      <OrdersScreen />
    </AuthGate>
  )
}
