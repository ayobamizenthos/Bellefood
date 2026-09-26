'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImageUp, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { cldThumb } from '@/lib/image'
import { slugify } from '@/lib/text'
import type { StoreKind } from '@/lib/types'
import { useCategories } from '@/hooks/useCategories'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { Button, buttonClassName } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { SegmentTab } from '@/components/ui/SegmentTab'

const THUMBNAIL_WIDTH = 240
const STORES: { value: StoreKind; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'supermarket', label: 'Supermarket' },
]

const parseAmount = (raw: string): number | null => {
  const value = Number(raw)
  return raw.trim() !== '' && Number.isFinite(value) && value >= 0 ? value : null
}

export default function ProductEditScreen({ productId }: { productId?: string }) {
  const router = useRouter()
  const isNew = !productId

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { categories } = useCategories(true)
  const [store, setStore] = useState<StoreKind>('restaurant')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [stock, setStock] = useState('100')
  const [lowStock, setLowStock] = useState('5')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [featured, setFeatured] = useState(false)
  const [inStock, setInStock] = useState(true)
  const [uploading, setUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const storeCategories = useMemo(
    () => categories.filter(entry => entry.store === store),
    [categories, store]
  )

  useEffect(() => {
    if (storeCategories.length === 0) return
    if (!storeCategories.some(entry => entry.slug === category)) setCategory(storeCategories[0].slug)
  }, [category, storeCategories])

  useEffect(() => {
    if (!productId) return
    Promise.all([
      supabase.from('products').select('*').eq('id', productId).maybeSingle(),
      supabase.from('product_costs').select('cost').eq('product_id', productId).maybeSingle(),
    ]).then(([{ data: product }, { data: costRow }]) => {
      if (product) {
        setStore(product.store === 'supermarket' ? 'supermarket' : 'restaurant')
        setName(product.name)
        setCategory(product.category)
        setPrice(String(product.price))
        setStock(String(product.stock))
        setLowStock(String(product.low_stock_threshold))
        setDescription(product.description ?? '')
        setImages(product.images)
        setFeatured(product.featured)
        setInStock(product.in_stock)
      }
      if (costRow) setCost(String(costRow.cost))
      setLoading(false)
    })
  }, [productId])

  const uploadImages = async (files: FileList) => {
    setError('')
    setUploading(true)
    const results = await Promise.allSettled(Array.from(files, file => uploadToCloudinary(file)))
    const uploaded = results.flatMap(outcome => (outcome.status === 'fulfilled' ? [outcome.value] : []))
    const failed = results.length - uploaded.length
    setImages(current => [...current, ...uploaded])
    setUploading(false)
    if (failed > 0) setError(`${failed} photo${failed === 1 ? '' : 's'} could not be uploaded.`)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const saveProduct = async () => {
    setError('')
    const priceValue = parseAmount(price)
    const stockValue = parseAmount(stock)
    const lowStockValue = parseAmount(lowStock)
    const costValue = cost.trim() === '' ? null : parseAmount(cost)
    if (!name.trim() || priceValue === null) {
      setError('Name and a valid price are required.')
      return
    }
    if (stockValue === null || lowStockValue === null || (cost.trim() !== '' && costValue === null)) {
      setError('Stock, low stock alert and cost must be numbers of 0 or more.')
      return
    }
    if (!category) {
      setError('Pick a category. Create one for this store first if the list is empty.')
      return
    }
    setSaving(true)

    const details = {
      store,
      name: name.trim(),
      category,
      price: priceValue,
      stock: Math.trunc(stockValue),
      low_stock_threshold: Math.trunc(lowStockValue),
      description: description.trim() || null,
      images,
      featured,
      in_stock: inStock,
    }

    const { data: saved, error: saveError } = productId
      ? await supabase.from('products').update(details).eq('id', productId).select('id').single()
      : await supabase
          .from('products')
          .insert({ ...details, slug: slugify(details.name) || slugify(`${category}-${Date.now()}`) })
          .select('id')
          .single()

    if (saveError || !saved) {
      setSaving(false)
      setError(saveError?.code === '23505' ? 'Another product already uses that name or SKU.' : 'The product could not be saved.')
      return
    }

    const { error: costError } =
      costValue === null
        ? await supabase.from('product_costs').delete().eq('product_id', saved.id)
        : await supabase
            .from('product_costs')
            .upsert({ product_id: saved.id, cost: costValue, updated_at: new Date().toISOString() })

    setSaving(false)
    if (costError) {
      setError('The product was saved but its cost price was not. Please try again.')
      return
    }
    router.push('/admin/products')
  }

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href="/admin/products"
        className="flex min-h-[44px] items-center gap-1 self-start text-body font-semibold text-brand"
      >
        <ArrowLeft size={16} /> Products
      </Link>
      <h1 className="text-2xl font-bold">{isNew ? 'Add Item' : 'Edit Item'}</h1>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="input-label mb-1.5">Store</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-line p-1">
          {STORES.map(option => (
            <SegmentTab key={option.value} active={store === option.value} onSelect={() => setStore(option.value)}>
              {option.label}
            </SegmentTab>
          ))}
        </div>
      </fieldset>

      <Field label="Name">
        <input value={name} onChange={event => setName(event.target.value)} className="input" />
      </Field>

      <Field label="Category">
        <select value={category} onChange={event => setCategory(event.target.value)} className="input">
          {storeCategories.map(entry => (
            <option key={entry.slug} value={entry.slug}>
              {entry.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₦)">
          <input type="number" min="0" inputMode="decimal" value={price} onChange={event => setPrice(event.target.value)} className="input" />
        </Field>
        <Field label="Cost price (₦)" hint="Only admins can see this.">
          <input type="number" min="0" inputMode="decimal" value={cost} onChange={event => setCost(event.target.value)} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock quantity">
          <input type="number" min="0" inputMode="numeric" value={stock} onChange={event => setStock(event.target.value)} className="input" />
        </Field>
        <Field label="Low stock alert">
          <input type="number" min="0" inputMode="numeric" value={lowStock} onChange={event => setLowStock(event.target.value)} className="input" />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-line bg-white p-3 text-body outline-none focus:border-brand"
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="input-label">Photos</span>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          aria-label="Upload photos"
          className="hidden"
          onChange={event => event.target.files && void uploadImages(event.target.files)}
        />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url, index) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-line">
              <Image src={cldThumb(url, THUMBNAIL_WIDTH)} alt="" fill sizes="120px" className="object-cover" />
              <button
                type="button"
                onClick={() => setImages(current => current.filter((_, position) => position !== index))}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute right-0 top-0 grid h-11 w-11 place-items-center"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink shadow-card">
                  <X size={14} />
                </span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand/50 bg-brand-tint/50 text-brand"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageUp size={20} />}
            <span className="text-label font-semibold">{uploading ? 'Uploading' : 'Upload'}</span>
          </button>
        </div>
        <p className="text-label text-ink-muted">First photo is the main image.</p>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-line p-3">
        <input
          type="checkbox"
          checked={featured}
          onChange={event => setFeatured(event.target.checked)}
          className="h-5 w-5 accent-brand"
        />
        <span className="font-medium">Feature on home page</span>
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-line p-3">
        <input
          type="checkbox"
          checked={inStock}
          onChange={event => setInStock(event.target.checked)}
          className="h-5 w-5 accent-brand"
        />
        <span className="font-medium">In stock (uncheck to mark out of stock)</span>
      </label>

      <FormError message={error} />

      <div className="flex gap-3">
        <Link href="/admin/products" className={buttonClassName({ variant: 'secondary', size: 'lg', fullWidth: true })}>
          Cancel
        </Link>
        <Button size="lg" fullWidth loading={saving} onClick={saveProduct}>
          Save Item
        </Button>
      </div>
    </div>
  )
}
