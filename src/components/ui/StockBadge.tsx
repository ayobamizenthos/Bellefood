import { cn } from '@/lib/cn'
import type { Product } from '@/lib/types'

export type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock'

export function stockLevel(
  product: Pick<Product, 'in_stock' | 'stock' | 'low_stock_threshold'>
): StockLevel {
  if (!product.in_stock) return 'out_of_stock'
  if (product.stock > 0 && product.stock <= product.low_stock_threshold) return 'low_stock'
  return 'in_stock'
}

const meta: Record<StockLevel, { label: string; className: string }> = {
  in_stock: { label: 'In Stock', className: 'text-success bg-success/10' },
  low_stock: { label: 'Low Stock', className: 'text-brand bg-brand-tint' },
  out_of_stock: { label: 'Out of Stock', className: 'text-ink-muted bg-line' },
}

export function StockBadge({ level, className }: { level: StockLevel; className?: string }) {
  const { label, className: tone } = meta[level]
  return (
    <span
      className={cn('inline-flex rounded-full px-2 py-0.5 text-label font-medium', tone, className)}
    >
      {label}
    </span>
  )
}
