export const STORE = {
  name: 'Belle Food',
  tagline: 'Good Food, Great Memories',
  address: '10 Abiola Court, Chevron Alternative Route, Lekki, Lagos',
  hours: 'Open 24 hours, every day',
  freeDeliveryThreshold: 100_000,
  whatsappNumber: '2349137421838',
  supportEmail: 'hello@bellefood.ng',
} as const

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'out_for_delivery',
  'delivered',
  'completed',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; description: string }> = {
  pending: { label: 'Pending', description: 'Awaiting confirmation' },
  processing: { label: 'Preparing', description: 'Your order is being prepared' },
  out_for_delivery: { label: 'On the Way', description: 'Out for delivery or ready for pickup' },
  delivered: { label: 'Delivered', description: 'Delivered or picked up' },
  completed: { label: 'Completed', description: 'Order fully finished' },
}

export type PaymentStatus = 'pending' | 'verified' | 'failed'

export type NotificationType =
  | 'payment_verified'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'new_order'
