import type { ReactNode } from 'react'
import type { Order } from '@/lib/types'
import { cartItemTotal, orderItems } from '@/lib/types'
import { formatNaira } from '@/lib/format'
import { cn } from '@/lib/cn'

export function SummaryRow({
  label,
  value,
  tone = 'default',
}: {
  label: ReactNode
  value: string
  tone?: 'default' | 'reward'
}) {
  return (
    <div className={cn('flex justify-between py-0.5', tone === 'reward' && 'text-success')}>
      <span className={cn(tone === 'default' && 'text-ink-muted')}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

export const deliveryFeeLabel = (fee: number): string => (fee === 0 ? 'Free' : formatNaira(fee))

export const rewardsDiscountLabel = (discount: number): string => `-${formatNaira(discount)}`

type ReceiptOrder = Pick<Order, 'items' | 'subtotal' | 'delivery_fee' | 'points_discount' | 'total'>

export function OrderReceipt({ order }: { order: ReceiptOrder }) {
  const items = orderItems(order)
  const discount = Number(order.points_discount)

  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <h2 className="mb-3 font-bold">Items</h2>
      <ul className="flex flex-col gap-2">
        {items.map(item => (
          <li key={item.productId} className="flex justify-between gap-3 text-body">
            <span className="text-ink-muted">
              {item.name} x {item.quantity}
            </span>
            <span className="font-semibold">{formatNaira(cartItemTotal(item))}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-line pt-3 text-body">
        <SummaryRow label="Subtotal" value={formatNaira(order.subtotal)} />
        <SummaryRow label="Delivery" value={deliveryFeeLabel(order.delivery_fee)} />
        {discount > 0 && (
          <SummaryRow label="Belle Rewards" value={rewardsDiscountLabel(discount)} tone="reward" />
        )}
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-lg font-bold text-brand">
          <span>Total</span>
          <span>{formatNaira(order.total)}</span>
        </div>
      </div>
    </section>
  )
}
