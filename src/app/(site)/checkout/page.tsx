import type { Metadata } from 'next'
import { AuthGate } from '@/components/auth/AuthGate'
import CheckoutScreen from './CheckoutScreen'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AuthGate
      title="Sign in to check out"
      message="Sign in to complete your order, choose delivery and pay securely by card or bank transfer."
    >
      <CheckoutScreen />
    </AuthGate>
  )
}
