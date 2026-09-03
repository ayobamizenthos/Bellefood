'use client'

import Image from 'next/image'
import { Link } from '@/lib/router'
import { Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useAdminProducts } from '@/hooks/useAdmin'
import { useCategories, categoryLabel } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { formatNaira } from '@/lib/format'
import { cn } from '@/lib/cn'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { StockBadge, stockLevel } from '@/components/ui/StockBadge'
import { Button } from '@/components/ui/Button'

export default function AdminProducts() {
  const { products, loading, reload } = useAdminProducts()
  const { categories } = useCategories(true)

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    await supabase.from('products').delete().eq('id', id)
    reload()
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    await supabase.from('products').update({ featured: !featured }).eq('id', id)
    reload()
  }

  const toggleStock = async (id: string, inStock: boolean) => {
    await supabase.from('products').update({ in_stock: !inStock }).eq('id', id)
    reload()
  }

  if (loading) return <PageSpinner />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link to="/admin/products/new">
          <Button size="sm">
            <Plus size={16} /> Add Product
          </Button>
        </Link>
      </div>

      <p className="text-body text-ink-muted">
        Star a product to feature it in the home highlights. Toggle the stock pill to mark it in or
        out of stock.
      </p>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="divide-y divide-line">
          {products.map(product => {
            return (
              <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
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
                    onClick={() => toggleStock(product.id, product.in_stock)}
                    aria-label={product.in_stock ? 'Mark out of stock' : 'Mark in stock'}
                    className="mt-1"
                  >
                    <StockBadge level={stockLevel(product)} />
                  </button>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => toggleFeatured(product.id, product.featured)}
                    className="grid h-9 w-9 place-items-center rounded-lg hover:bg-brand-tint"
                    aria-label={product.featured ? 'Remove from highlights' : 'Add to highlights'}
                  >
                    <Star
                      size={16}
                      className={cn(
                        product.featured ? 'fill-brand text-brand' : 'text-ink-muted'
                      )}
                    />
                  </button>
                  <Link
                    to={`/admin/products/${product.id}`}
                    className="grid h-9 w-9 place-items-center rounded-lg hover:bg-brand-tint"
                    aria-label="Edit"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    onClick={() => remove(product.id, product.name)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-danger hover:bg-danger/10"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
          {products.length === 0 && (
            <p className="px-4 py-8 text-center text-body text-ink-muted">No products.</p>
          )}
        </div>
      </div>
    </div>
  )
}
