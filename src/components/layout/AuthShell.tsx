import Image from 'next/image'
import { Link } from '@/lib/router'
import type { ReactNode } from 'react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="app-shell flex flex-1 flex-col justify-center py-10">
        <div className="mx-auto w-full max-w-app">
          <Link to="/" className="mb-8 flex items-center justify-center" aria-label="BelleFOOD home">
            <Image
              src="/bellefood-text.png"
              alt="BelleFOOD, the taste is delicious"
              width={1024}
              height={238}
              priority
              className="h-16 w-auto"
            />
          </Link>

          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-body text-ink-muted">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  )
}
