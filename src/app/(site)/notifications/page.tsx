import type { Metadata } from 'next'
import { AuthGate } from '@/components/auth/AuthGate'
import NotificationsScreen from './NotificationsScreen'

export const metadata: Metadata = {
  title: 'Notifications',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AuthGate
      title="Sign in to see notifications"
      message="Get real-time updates on your orders and deliveries. Sign in to view your notifications."
    >
      <NotificationsScreen />
    </AuthGate>
  )
}
