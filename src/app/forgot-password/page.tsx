import type { Metadata } from 'next'
import { Suspense } from 'react'
import ForgotPasswordScreen from './ForgotPasswordScreen'

export const metadata: Metadata = { title: 'Forgot Password' }

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordScreen />
    </Suspense>
  )
}
