import type { Metadata } from 'next'
import HomeScreen from './HomeScreen'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function Page() {
  return (
    <>
      <h1 className="sr-only">
        Belle Food, order fresh Nigerian meals and everyday groceries in Lagos, open 24/7
      </h1>
      <HomeScreen />
    </>
  )
}
