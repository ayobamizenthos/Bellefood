'use client'

import { Link, useNavigate } from '@/lib/router'
import {
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Shield,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { useOrders } from '@/hooks/useOrders'
import { useSavedProducts } from '@/hooks/useSavedProducts'
import { useSupportSheet } from '@/stores/support'
import { formatNaira } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/product/ProductCard'

export default function AccountPage() {
  const navigate = useNavigate()
  const { session, profile, isAdmin, signOut } = useAuth()
  const { orders } = useOrders()
  const { products: savedProducts } = useSavedProducts()
  const showSupport = useSupportSheet(s => s.show)

  const totalSpent = orders
    .filter(o => o.payment_status === 'verified')
    .reduce((sum, o) => sum + o.total, 0)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="mx-auto flex max-w-app flex-col gap-5">
      <section className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-xl font-bold text-white">
          {(profile?.full_name ?? session?.user.email ?? 'Z').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{profile?.full_name ?? 'Belle Food Customer'}</p>
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
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center justify-between rounded-2xl bg-ink p-4 text-white"
        >
          <span className="flex items-center gap-3 font-semibold">
            <Shield size={20} /> Open Admin Dashboard
          </span>
          <ChevronRight size={20} />
        </button>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Heart size={18} className="text-brand" /> Saved Items
          </h2>
          <span className="text-body text-ink-muted">{savedProducts.length}</span>
        </div>
        {savedProducts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center">
            <p className="text-body text-ink-muted">You have not saved any products yet.</p>
            <Link to="/shop" className="mt-1 inline-block text-body font-semibold text-brand">
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

      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <Row
          icon={<Package size={18} />}
          label="Order History"
          onClick={() => navigate('/orders')}
        />
        <Row
          icon={<MapPin size={18} />}
          label="Delivery Address"
          onClick={() => navigate('/account/address')}
        />
        <Row icon={<MessageCircle size={18} />} label="Contact Support" onClick={showSupport} />
      </section>

      <Button variant="secondary" size="lg" fullWidth onClick={handleSignOut}>
        <LogOut size={18} /> Logout
      </Button>
    </div>
  )
}

function Row({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-line px-4 py-3.5 text-left last:border-0 hover:bg-brand-tint/40"
    >
      <span className="flex items-center gap-3 font-medium">
        <span className="text-brand">{icon}</span>
        {label}
      </span>
      <ChevronRight size={18} className="text-ink-muted" />
    </button>
  )
}
