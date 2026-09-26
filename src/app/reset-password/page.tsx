import type { Metadata } from 'next'
import { Suspense } from 'react'
import ResetPasswordScreen from './ResetPasswordScreen'

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  )
}
