import type { Metadata } from 'next'
import { Suspense } from 'react'
import ShopScreen from './ShopScreen'

export const metadata: Metadata = {
  title: 'Order Food & Groceries in Lagos',
  description:
    'Browse the Belle Food restaurant menu and supermarket. Fresh Nigerian meals, provisions, drinks and everyday groceries, delivered fast across Lagos or ready for pickup, 24/7.',
  alternates: { canonical: '/shop' },
}

export default function Page() {
  return (
    <Suspense>
      <ShopScreen />
    </Suspense>
  )
}
