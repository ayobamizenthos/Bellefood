import type { Database } from './database.types'

type Tables = Database['public']['Tables']

export type Product = Tables['products']['Row']
export type Order = Tables['orders']['Row']
export type OrderStatusLog = Tables['order_status_log']['Row']
export type Profile = Tables['profiles']['Row']
export type UserAddress = Tables['user_addresses']['Row']
export type AppNotification = Tables['notifications']['Row']
export type StoreSettings = Tables['store_settings']['Row']

export interface ProductSpecs {
  [key: string]: string
}

export interface CartItem {
  kind: 'product'
  productId: string
  name: string
  image: string | null
  category: string
  isCombo: boolean
  unitPrice: number
  quantity: number
}

export const cartItemTotal = (item: CartItem): number => item.unitPrice * item.quantity

export const cartItemKey = (item: CartItem): string => `p:${item.productId}`
