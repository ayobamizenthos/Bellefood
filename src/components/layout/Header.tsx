'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/cn'
import { isRouteActive } from '@/lib/routes'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/orders', label: 'Orders' },
  { to: '/account', label: 'Account' },
]

export function Header() {
  const { session } = useAuth()
  const { unreadCount } = useNotifications()
  const pathname = usePathname()

  return (
    <header className="site-header sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="app-shell flex h-14 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Belle Food home">
          <picture>
            <source srcSet="/bellefood-wordmark-dark.png" media="(prefers-color-scheme: dark)" />
            <img src="/bellefood-wordmark.png" alt="Belle Food" width={1024} height={168} className="h-7 w-auto" />
          </picture>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navLinks.map(link => {
            const active = isRouteActive(pathname, link.to, link.end)
            return (
              <Link
                key={link.to}
                href={link.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-2 text-body font-medium transition-colors',
                  active ? 'bg-brand-tint text-brand' : 'text-ink hover:bg-line/60'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 md:ml-2">
          {session && (
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-line/60"
            >
              <Bell size={20} className="text-ink" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
