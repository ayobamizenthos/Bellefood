import { STORE } from './constants'
import type { CartItem } from './types'
import { cartItemTotal } from './types'

export interface OrderTotals {
  subtotal: number
  deliveryFee: number
  total: number
  qualifiesForFreeDelivery: boolean
}

export function calculateTotals(items: CartItem[], deliveryFee: number): OrderTotals {
  const subtotal = items.reduce((sum, item) => sum + cartItemTotal(item), 0)
  const qualifiesForFreeDelivery = subtotal >= STORE.freeDeliveryThreshold
  const fee = qualifiesForFreeDelivery ? 0 : deliveryFee
  return {
    subtotal,
    deliveryFee: fee,
    total: subtotal + fee,
    qualifiesForFreeDelivery,
  }
}
