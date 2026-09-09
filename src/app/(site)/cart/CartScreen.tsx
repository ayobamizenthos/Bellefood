'use client'

import Image from 'next/image'
import { Link, useNavigate } from '@/lib/router'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '@/stores/cart'
import { cartItemKey } from '@/lib/types'
import { formatNaira } from '@/lib/format'
import { STORE } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/stores/auth'

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal } = useCart()
  const { session } = useAuth()
  const navigate = useNavigate()
  const total = subtotal()
  const freeDelivery = total >= STORE.freeDeliveryThreshold

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <ShoppingCart size={40} className="text-ink-muted" />
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <p className="text-body text-ink-muted">
          Browse our menu and add items to get started.
        </p>
        <Link to="/shop">
          <Button className="mt-2">Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  const checkout = () => navigate(session ? '/checkout' : '/login?from=/checkout')

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Cart</h1>

      <div className="flex flex-col gap-3">
        {items.map(item => {
          const key = cartItemKey(item)
          return (
            <div key={key} className="flex gap-3 rounded-2xl border border-line bg-white p-3">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="h-20 w-20 shrink-0 rounded-xl bg-line" />
              )}
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body font-semibold leading-tight">{item.name}</p>
                  <button
                    onClick={() => removeItem(key)}
                    aria-label="Remove"
                    className="text-ink-muted"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <p className="text-body text-ink-muted">{formatNaira(item.unitPrice)} each</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-line">
                    <button
                      onClick={() => setQuantity(key, item.quantity - 1)}
                      className="grid h-8 w-8 place-items-center"
                      aria-label="Decrease"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-body font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(key, item.quantity + 1)}
                      className="grid h-8 w-8 place-items-center"
                      aria-label="Increase"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-bold text-brand">
                    {formatNaira(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="flex justify-between text-body">
          <span className="text-ink-muted">Subtotal</span>
          <span className="font-semibold">{formatNaira(total)}</span>
        </div>
        <div className="mt-1 flex justify-between text-body">
          <span className="text-ink-muted">Delivery</span>
          <span className="font-semibold">{freeDelivery ? 'Free' : 'Calculated at checkout'}</span>
        </div>
        {!freeDelivery && (
          <p className="mt-2 rounded-lg bg-brand-tint px-3 py-2 text-label text-brand">
            Add {formatNaira(STORE.freeDeliveryThreshold - total)} more for free delivery.
          </p>
        )}
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold text-brand">{formatNaira(total)}</span>
        </div>
      </div>

      <Button size="lg" fullWidth onClick={checkout}>
        Proceed to Checkout
      </Button>
      <Link to="/shop" className="text-center text-body font-semibold text-brand">
        Continue Shopping
      </Link>
    </div>
  )
}
