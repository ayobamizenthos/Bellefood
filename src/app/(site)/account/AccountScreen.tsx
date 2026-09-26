'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Shield,
  User,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { useOrders } from '@/hooks/useOrders'
import { useSavedProducts } from '@/hooks/useSavedProducts'
import { useSupportSheet } from '@/stores/support'
import { formatNaira } from '@/lib/format'
import { ProductCard } from '@/components/product/ProductCard'
import { AlertsToggle } from '@/components/settings/AlertsToggle'
import { RewardsCard } from '@/components/account/RewardsCard'

export default function AccountScreen() {
  const router = useRouter()
  const { session, profile, isAdmin, signOut } = useAuth()
  const { orders } = useOrders()
  const { products: savedProducts } = useSavedProducts()
  const showSupport = useSupportSheet(state => state.show)

  const totalSpent = orders
    .filter(order => order.payment_status === 'verified' && order.status !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.total), 0)
  const initial = profile?.full_name?.trim().charAt(0).toUpperCase()

  const signOutToHome = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="mx-auto flex max-w-app flex-col gap-5">
      <section className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
        <span
          aria-hidden
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand text-xl font-bold text-white"
        >
          {initial || <User size={26} />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{profile?.full_name || 'Belle Food Customer'}</p>
          <p className="truncate text-body text-ink-muted">{session?.user.email}</p>
          {profile?.phone && <p className="text-body text-ink-muted">{profile.phone}</p>}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <Package size={22} className="text-brand" />
          <div>
            <p className="text-label text-ink-muted">Total Orders</p>
            <p className="text-lg font-bold">{orders.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <Wallet size={22} className="text-brand" />
          <div>
            <p className="text-label text-ink-muted">Total Spent</p>
            <p className="text-lg font-bold">{formatNaira(totalSpent)}</p>
          </div>
        </div>
      </section>

      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-2xl bg-ink p-4 text-white"
        >
          <span className="flex items-center gap-3 font-semibold">
            <Shield size={20} /> Open Admin Dashboard
          </span>
          <ChevronRight size={20} />
        </Link>
      )}

      <RewardsCard />

      <section id="saved-items" className="scroll-mt-20">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Heart size={18} className="text-brand" /> Saved Items
          </h2>
          <span className="text-body text-ink-muted">{savedProducts.length}</span>
        </div>
        {savedProducts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center">
            <p className="text-body text-ink-muted">You have not saved any products yet.</p>
            <Link href="/shop" className="mt-1 inline-flex min-h-[44px] items-center text-body font-semibold text-brand">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {savedProducts.map(product => (
              <div key={product.id} className="w-40 shrink-0 sm:w-48">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      <nav aria-label="Account" className="overflow-hidden rounded-2xl border border-line bg-white">
        <AccountLink icon={<Package size={18} />} label="Order History" href="/orders" />
        <AccountLink icon={<MapPin size={18} />} label="Delivery Address" href="/account/address" />
        <button
          type="button"
          onClick={showSupport}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-brand-tint/40"
        >
          <AccountLinkLabel icon={<MessageCircle size={18} />} label="Contact Support" />
        </button>
      </nav>

      <AlertsToggle />

      <button
        type="button"
        onClick={signOutToHome}
        className="mt-1 flex min-h-[44px] items-center justify-center gap-2 text-body font-semibold text-danger transition-opacity active:opacity-60"
      >
        <LogOut size={18} /> Sign out
      </button>
    </div>
  )
}

function AccountLinkLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <>
      <span className="flex items-center gap-3 font-medium">
        <span className="text-brand">{icon}</span>
        {label}
      </span>
      <ChevronRight size={18} className="text-ink-muted" />
    </>
  )
}

function AccountLink({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-between border-b border-line px-4 py-3.5 hover:bg-brand-tint/40"
    >
      <AccountLinkLabel icon={icon} label={label} />
    </Link>
  )
}
