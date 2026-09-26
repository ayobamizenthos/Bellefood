import type { CartItem } from './types'
import { cartItemTotal } from './types'

export interface OrderTotals {
  subtotal: number
  deliveryFee: number
  total: number
  qualifiesForFreeDelivery: boolean
}

export function calculateTotals(
  items: CartItem[],
  deliveryFee: number,
  freeDeliveryThreshold: number
): OrderTotals {
  const subtotal = items.reduce((sum, item) => sum + cartItemTotal(item), 0)
  const qualifiesForFreeDelivery = subtotal >= freeDeliveryThreshold
  const fee = qualifiesForFreeDelivery ? 0 : deliveryFee
  return { subtotal, deliveryFee: fee, total: subtotal + fee, qualifiesForFreeDelivery }
}

export const kitchenSubtotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => (item.store === 'restaurant' ? sum + cartItemTotal(item) : sum), 0)

export interface PointsRedemption {
  pointsUsed: number
  discount: number
}

/** Mirrors place_order: points cover kitchen food and delivery, never groceries. */
export function redeemPoints(
  balance: number,
  nairaPerPoint: number,
  eligibleAmount: number
): PointsRedemption {
  if (balance <= 0 || nairaPerPoint <= 0 || eligibleAmount <= 0) return { pointsUsed: 0, discount: 0 }
  const cappedDiscount = Math.min(balance * nairaPerPoint, eligibleAmount)
  const pointsUsed = Math.min(Math.ceil(cappedDiscount / nairaPerPoint), balance)
  return { pointsUsed, discount: Math.min(pointsUsed * nairaPerPoint, eligibleAmount) }
}
