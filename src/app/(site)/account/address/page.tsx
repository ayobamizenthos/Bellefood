import type { Metadata } from 'next'
import { AuthGate } from '@/components/auth/AuthGate'
import AddressScreen from './AddressScreen'

export const metadata: Metadata = {
  title: 'Delivery Address',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AuthGate
      title="Sign in to manage your address"
      message="Save your delivery address for faster checkout. Sign in to add or update it."
    >
      <AddressScreen />
    </AuthGate>
  )
}
