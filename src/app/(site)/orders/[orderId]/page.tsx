import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthGate } from '@/components/auth/AuthGate'
import OrderTrackingScreen from './OrderTrackingScreen'

export const metadata: Metadata = {
  title: 'Order Tracking',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AuthGate
      title="Sign in to track your order"
      message="Sign in to see the live status and delivery progress of your order."
    >
      <Suspense>
        <OrderTrackingScreen />
      </Suspense>
    </AuthGate>
  )
}
