import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignupScreen from './SignupScreen'

export const metadata: Metadata = {
  title: 'Create Account',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense>
      <SignupScreen />
    </Suspense>
  )
}
