'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { selectCartSubtotal, useCart } from '@/stores/cart'
import { useAuth } from '@/stores/auth'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { supabase } from '@/lib/supabase'
import { MAX_ITEM_QUANTITY, cartItemTotal, toCartItem } from '@/lib/types'
import type { CartItem, Product } from '@/lib/types'
import { formatNaira } from '@/lib/format'
import { cldThumb } from '@/lib/image'
import { cn } from '@/lib/cn'
import { buttonClassName } from '@/components/ui/Button'

const THUMBNAIL_WIDTH = 160

/** Refreshes cart lines from the live catalogue and reports the ones that can no longer be ordered. */
function useCartValidation(items: CartItem[], replaceItems: (items: CartItem[]) => void) {
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set())
  const productIds = useMemo(() => items.map(item => item.productId).sort().join(','), [items])

  useEffect(() => {
    if (!productIds) return
    let active = true
    supabase
      .from('products')
      .select('*')
      .in('id', productIds.split(','))
      .then(({ data }) => {
        if (!active || !data) return
        const current = new Map<string, Product>(data.map(product => [product.id, product]))
        const cartItems = useCart.getState().items
        const blocked = new Set<string>()
        const refreshed = cartItems.map(item => {
          const product = current.get(item.productId)
          if (!product || !product.is_published || !product.in_stock) {
            blocked.add(item.productId)
            return item
          }
          return toCartItem(product, item.quantity)
        })
        setUnavailable(blocked)
        replaceItems(refreshed)
      })
    return () => {
      active = false
    }
  }, [productIds, replaceItems])

  return unavailable
}

export default function CartScreen() {
  const items = useCart(state => state.items)
  const setQuantity = useCart(state => state.setQuantity)
  const removeItem = useCart(state => state.removeItem)
  const replaceItems = useCart(state => state.replaceItems)
  const subtotal = useCart(selectCartSubtotal)
  const { session } = useAuth()
  const { settings } = useStoreSettings()
  const unavailable = useCartValidation(items, replaceItems)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <ShoppingCart size={40} className="text-ink-muted" />
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <p className="text-body text-ink-muted">Browse our menu and add items to get started.</p>
        <Link href="/shop" className={cn(buttonClassName(), 'mt-2')}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  const threshold = settings ? Number(settings.free_delivery_threshold) : null
  const freeDelivery = threshold !== null && subtotal >= threshold
  const blocked = items.some(item => unavailable.has(item.productId))

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Cart</h1>

      <ul className="flex flex-col gap-3">
        {items.map(item => {
          const isUnavailable = unavailable.has(item.productId)
          return (
            <li key={item.productId} className="flex gap-3 rounded-2xl border border-line bg-white p-3">
              {item.image ? (
                <Image
                  src={cldThumb(item.image, THUMBNAIL_WIDTH)}
                  alt=""
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
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name}`}
                    className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center text-ink-muted"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {isUnavailable ? (
                  <p className="flex items-center gap-1 text-label font-semibold text-danger">
                    <AlertTriangle size={14} /> No longer available. Remove it to check out.
                  </p>
                ) : (
                  <p className="text-body text-ink-muted">{formatNaira(item.unitPrice)} each</p>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-line">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="grid h-11 w-11 place-items-center"
                      aria-label={`Remove one ${item.name}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-body font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= MAX_ITEM_QUANTITY || isUnavailable}
                      className="grid h-11 w-11 place-items-center disabled:opacity-40"
                      aria-label={`Add one more ${item.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-bold text-brand">{formatNaira(cartItemTotal(item))}</span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="flex justify-between text-body">
          <span className="text-ink-muted">Subtotal</span>
          <span className="font-semibold">{formatNaira(subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-body">
          <span className="text-ink-muted">Delivery</span>
          <span className="font-semibold">{freeDelivery ? 'Free' : 'Calculated at checkout'}</span>
        </div>
        {threshold !== null && !freeDelivery && (
          <p className="mt-2 rounded-lg bg-brand-tint px-3 py-2 text-label text-brand">
            Add {formatNaira(threshold - subtotal)} more for free delivery.
          </p>
        )}
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold text-brand">{formatNaira(subtotal)}</span>
        </div>
      </div>

      {blocked ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">
          Some items are no longer available. Remove them to continue.
        </p>
      ) : (
        <Link
          href={session ? '/checkout' : '/login?from=/checkout'}
          className={buttonClassName({ size: 'lg', fullWidth: true })}
        >
          Proceed to Checkout
        </Link>
      )}
      <Link
        href="/shop"
        className="flex min-h-[44px] items-center justify-center text-body font-semibold text-brand"
      >
        Continue Shopping
      </Link>
    </div>
  )
}
