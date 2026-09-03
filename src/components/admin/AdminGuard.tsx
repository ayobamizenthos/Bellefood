'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/stores/auth'
import { Navigate } from '@/lib/router'
import { PageSpinner } from '@/components/ui/PageSpinner'

export function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, isAdmin, session } = useAuth()
  if (loading) return <PageSpinner />
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
