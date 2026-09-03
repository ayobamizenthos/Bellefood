import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginScreen from './LoginScreen'

export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  )
}
