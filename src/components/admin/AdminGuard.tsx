'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth'
import { PageSpinner } from '@/components/ui/BrandLoader'

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { loading, isAdmin, session } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!session) router.replace('/login?from=/admin')
    else if (!isAdmin) router.replace('/')
  }, [loading, session, isAdmin, router])

  if (loading || !isAdmin) return <PageSpinner />
  return <>{children}</>
}
