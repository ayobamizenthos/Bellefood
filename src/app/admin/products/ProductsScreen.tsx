'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Pencil, Plus, Star, Store, Trash2, UtensilsCrossed } from 'lucide-react'
import { useAdminProducts } from '@/hooks/useAdmin'
import { categoryLabel, useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { formatNaira } from '@/lib/format'
import { cldThumb } from '@/lib/image'
import type { Product, StoreKind } from '@/lib/types'
import { cn } from '@/lib/cn'
import { SegmentTab } from '@/components/ui/SegmentTab'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { StockBadge, stockLevel } from '@/components/ui/StockBadge'
import { buttonClassName } from '@/components/ui/Button'
import { FormError } from '@/components/ui/Field'

const THUMBNAIL_WIDTH = 96

export default function ProductsScreen() {
  const { products, loading, reload } = useAdminProducts()
  const { categories } = useCategories(true)
  const [tab, setTab] = useState<StoreKind>('restaurant')
  const [error, setError] = useState('')

  const shown = products.filter(product => product.store === tab)
  const kitchenCount = products.filter(product => product.store === 'restaurant').length
  const martCount = products.length - kitchenCount

  const saveChange = async (change: PromiseLike<{ error: unknown }>) => {
    setError('')
    const { error: changeError } = await change
    if (changeError) setError('That change could not be saved. Please try again.')
    await reload()
  }

  const deleteProduct = (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    void saveChange(supabase.from('products').delete().eq('id', product.id))
  }

  const toggleFeatured = (product: Product) =>
    saveChange(supabase.from('products').update({ featured: !product.featured }).eq('id', product.id))

  const toggleStock = (product: Product) =>
    saveChange(supabase.from('products').update({ in_stock: !product.in_stock }).eq('id', product.id))

  if (loading) return <PageSpinner />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className={buttonClassName({ size: 'sm' })}>
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <p className="text-body text-ink-muted">
        Star a product to feature it in the home highlights. Tap the stock pill to mark it in or out
        of stock.
      </p>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-1">
        <SegmentTab active={tab === 'restaurant'} onSelect={() => setTab('restaurant')}>
          <UtensilsCrossed size={17} /> Meals ({kitchenCount})
        </SegmentTab>
        <SegmentTab active={tab === 'supermarket'} onSelect={() => setTab('supermarket')}>
          <Store size={17} /> Mart ({martCount})
        </SegmentTab>
      </div>

      <FormError message={error} />

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="divide-y divide-line">
          {shown.map(product => (
            <div key={product.id} className="flex items-center gap-3 px-4 py-3">
              {product.images[0] ? (
                <Image
                  src={cldThumb(product.images[0], THUMBNAIL_WIDTH)}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-lg object-contain"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-lg bg-line" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{product.name}</p>
                <p className="truncate text-label text-ink-muted">
                  {categoryLabel(categories, product.category)} · {formatNaira(product.price)}
                </p>
                <button
                  type="button"
                  onClick={() => toggleStock(product)}
                  aria-label={product.in_stock ? 'Mark out of stock' : 'Mark in stock'}
                  className="flex min-h-[44px] items-center"
                >
                  <StockBadge level={stockLevel(product)} />
                </button>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => toggleFeatured(product)}
                  className="grid h-11 w-11 place-items-center rounded-lg hover:bg-brand-tint"
                  aria-label={product.featured ? 'Remove from highlights' : 'Add to highlights'}
                  aria-pressed={product.featured}
                >
                  <Star size={16} className={cn(product.featured ? 'fill-brand text-brand' : 'text-ink-muted')} />
                </button>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="grid h-11 w-11 place-items-center rounded-lg hover:bg-brand-tint"
                  aria-label={`Edit ${product.name}`}
                >
                  <Pencil size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => deleteProduct(product)}
                  className="grid h-11 w-11 place-items-center rounded-lg text-danger hover:bg-danger/10"
                  aria-label={`Delete ${product.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {shown.length === 0 && (
            <p className="px-4 py-8 text-center text-body text-ink-muted">No products in this store yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
