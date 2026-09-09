import type { Metadata } from 'next'
import CartScreen from './CartScreen'

export const metadata: Metadata = {
  title: 'Your Cart',
  robots: { index: false, follow: true },
}

export default function Page() {
  return <CartScreen />
}
