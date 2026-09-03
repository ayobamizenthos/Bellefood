'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Link, useNavigate, useParams } from '@/lib/router'
import { ArrowLeft, ImageUp, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { useCategories } from '@/hooks/useCategories'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function AdminProductEdit() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const isNew = !productId

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { categories } = useCategories(true)
  const [store, setStore] = useState<'restaurant' | 'supermarket'>('restaurant')
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
    () => categories.filter(c => c.store === store),
    [categories, store]
  )

  useEffect(() => {
    if (isNew && storeCategories.length && !storeCategories.some(c => c.slug === category)) {
      setCategory(storeCategories[0].slug)
    }
  }, [isNew, category, storeCategories])

  useEffect(() => {
    if (isNew) return
    supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()
      .then(({ data }) => {
        if (data) {
          setStore(data.store === 'supermarket' ? 'supermarket' : 'restaurant')
          setName(data.name)
          setCategory(data.category)
          setPrice(String(data.price))
          setCost(data.cost ? String(data.cost) : '')
          setStock(String(data.stock))
          setLowStock(String(data.low_stock_threshold))
          setDescription(data.description ?? '')
          setImages(data.images)
          setFeatured(data.featured)
          setInStock(data.in_stock)
        }
        setLoading(false)
      })
  }, [isNew, productId])

  const uploadImages = async (files: FileList) => {
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const url = await uploadToCloudinary(file)
      if (url) uploaded.push(url)
    }
    setImages(prev => [...prev, ...uploaded])
    setUploading(false)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const save = async () => {
    setError('')
    if (!name || !price) {
      setError('Name and price are required.')
      return
    }
    setSaving(true)

    const payload = {
      store,
      name,
      slug: slugify(name) || slugify(`${category}-${Date.now()}`),
      category,
      price: Number(price),
      cost: cost ? Number(cost) : null,
      stock: Number(stock),
      low_stock_threshold: Number(lowStock),
      description: description || null,
      images: images.filter(url => url.trim()),
      specs: {},
      featured,
      in_stock: inStock,
    }

    const result = isNew
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', productId)

    setSaving(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    navigate('/admin/products')
  }

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        to="/admin/products"
        className="flex items-center gap-1 text-body font-semibold text-brand"
      >
        <ArrowLeft size={16} /> Products
      </Link>
      <h1 className="text-2xl font-bold">{isNew ? 'Add Item' : 'Edit Item'}</h1>

      <Field label="Store">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-line p-1">
          {(['restaurant', 'supermarket'] as const).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setStore(value)}
              className={cn(
                'rounded-lg py-2 text-body font-semibold capitalize transition-colors',
                store === value ? 'bg-brand text-white' : 'text-ink-muted'
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Name">
        <input value={name} onChange={e => setName(e.target.value)} className="input" />
      </Field>

      <Field label="Category">
        <select value={category} onChange={e => setCategory(e.target.value)} className="input">
          {storeCategories.map(c => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₦)">
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Cost price (₦)">
          <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock quantity">
          <input
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Low stock alert">
          <input
            type="number"
            value={lowStock}
            onChange={e => setLowStock(e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
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
          onChange={e => e.target.files && uploadImages(e.target.files)}
        />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl border border-line"
            >
              <Image src={url} alt="" fill sizes="120px" className="object-cover" />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                aria-label="Remove photo"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-ink shadow-card"
              >
                <X size={14} />
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
          onChange={e => setFeatured(e.target.checked)}
          className="h-5 w-5 accent-brand"
        />
        <span className="font-medium">Feature on home page</span>
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-line p-3">
        <input
          type="checkbox"
          checked={inStock}
          onChange={e => setInStock(e.target.checked)}
          className="h-5 w-5 accent-brand"
        />
        <span className="font-medium">In stock (uncheck to mark out of stock)</span>
      </label>

      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>}

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => navigate('/admin/products')}
        >
          Cancel
        </Button>
        <Button size="lg" className="flex-1" loading={saving} onClick={save}>
          Save Item
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="input-label">{label}</span>
      {children}
    </label>
  )
}
