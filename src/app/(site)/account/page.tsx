import type { Metadata } from 'next'
import { AuthGate } from '@/components/auth/AuthGate'
import AccountScreen from './AccountScreen'

export const metadata: Metadata = {
  title: 'Your Account',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AuthGate
      title="Sign in to your account"
      message="Manage your profile, delivery address and saved items. Sign in to access your Belle Food account."
    >
      <AccountScreen />
    </AuthGate>
  )
}
