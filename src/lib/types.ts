import type { Database } from './database.types'

type Tables = Database['public']['Tables']

export type Product = Tables['products']['Row']
export type Order = Tables['orders']['Row']
export type OrderStatusLog = Tables['order_status_log']['Row']
export type Profile = Tables['profiles']['Row']
export type UserAddress = Tables['user_addresses']['Row']
export type AppNotification = Tables['notifications']['Row']
export type StoreSettings = Tables['store_settings']['Row']
export type Category = Tables['categories']['Row']
export type DeliveryZone = Tables['delivery_zones']['Row']
export type LoyaltySettings = Pick<
  Tables['loyalty_settings']['Row'],
  'naira_per_point' | 'earn_per_order' | 'earn_per_referral' | 'welcome_bonus'
>

export type StoreKind = 'restaurant' | 'supermarket'
export type FulfilmentMethod = 'delivery' | 'pickup'

export interface CartItem {
  productId: string
  name: string
  image: string | null
  category: string
  store?: string
  isCombo: boolean
  unitPrice: number
  quantity: number
}

/** The contact and address snapshot place_order writes onto every order. */
export interface DeliveryAddress {
  method: FulfilmentMethod
  fullName: string
  phone: string
  street?: string | null
  landmark?: string | null
  zone?: string | null
  zoneId?: string | null
}

export const MAX_ITEM_QUANTITY = 99

export const cartItemTotal = (item: CartItem): number => item.unitPrice * item.quantity

export function toCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    name: product.name,
    image: product.images[0] ?? null,
    category: product.category,
    store: product.store,
    isCombo: product.is_combo,
    unitPrice: product.price,
    quantity,
  }
}

// Order json columns are written only by place_order, whose shape these mirror.
export const orderItems = (order: Pick<Order, 'items'>): CartItem[] =>
  order.items as unknown as CartItem[]

export const orderAddress = (order: Pick<Order, 'delivery_address'>): DeliveryAddress =>
  order.delivery_address as unknown as DeliveryAddress
