import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { AdminChrome } from '@/components/admin/AdminChrome'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminChrome>{children}</AdminChrome>
    </AdminGuard>
  )
}
