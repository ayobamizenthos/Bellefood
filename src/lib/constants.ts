import type { Database } from './database.types'

type Enums = Database['public']['Enums']

export const STORE = {
  name: 'Belle Food',
  tagline: 'Good Food, Great Memories',
  address: '10 Abiola Court, Chevron Alternative Route, Lekki, Lagos',
  hours: 'Open 24 hours, every day',
  whatsappNumber: '2349137421838',
  supportEmail: 'hello@bellefood.ng',
  instagramHandle: 'bellefood.ng',
} as const

export type OrderStatus = Enums['order_status']
export type PaymentStatus = Enums['payment_status']
export type NotificationType = Enums['notification_type']

// "delivered" stays in the enum for old rows; orders now go from on the way straight to completed.
export const ORDER_STAGES = [
  'pending',
  'processing',
  'out_for_delivery',
  'completed',
] as const satisfies readonly OrderStatus[]

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; description: string }> = {
  pending: { label: 'Pending', description: 'Awaiting confirmation' },
  processing: { label: 'Processing', description: 'Your order is being prepared' },
  out_for_delivery: { label: 'On the Way', description: 'Out for delivery or ready for pickup' },
  delivered: { label: 'Delivered', description: 'Delivered or picked up' },
  completed: { label: 'Completed', description: 'Order fully finished' },
  cancelled: { label: 'Cancelled', description: 'This order was cancelled' },
}

export const PICKUP_STAGE_LABELS: Partial<Record<OrderStatus, string>> = {
  out_for_delivery: 'Ready for Pickup',
  delivered: 'Picked Up',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Awaiting verification',
  verified: 'Verified',
  failed: 'Not received',
}
