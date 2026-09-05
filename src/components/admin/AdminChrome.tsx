'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { NavLink, useNavigate } from '@/lib/router'
import {
  LayoutDashboard,
  Package,
  Tags,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Store,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/cn'
import { PushOptIn } from '@/components/layout/PushOptIn'

const links: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminChrome({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex min-h-dvh bg-brand-tint/20">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-line px-5">
          <Image
            src="/bellefood-mark.png"
            alt="Belle Food"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <span className="font-bold">BelleFOOD Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-body font-medium transition-colors',
                  isActive ? 'bg-brand text-white' : 'text-ink hover:bg-brand-tint'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-body font-medium hover:bg-brand-tint"
          >
            <Store size={18} /> View Store
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body font-medium text-danger hover:bg-danger/10"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 md:pl-60">
        <MobileTabBar />
        <main className="app-shell py-6 pb-24 md:pb-6">{children}</main>
      </div>
      <PushOptIn />
    </div>
  )
}

function MobileTabBar() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white md:hidden">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
              isActive ? 'text-brand' : 'text-ink-muted'
            )
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
