'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/text'
import type { Category, StoreKind } from '@/lib/types'
import { cn } from '@/lib/cn'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/Field'
import { SegmentTab } from '@/components/ui/SegmentTab'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'

const SAVE_FAILED = 'That change could not be saved. Please try again.'

const byOrder = (first: Category, second: Category) => first.sort_order - second.sort_order

export default function CategoriesScreen() {
  const { categories, loading } = useCategories(true)
  const [items, setItems] = useState<Category[]>([])
  const [store, setStore] = useState<StoreKind>('restaurant')
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setItems(categories)
  }, [categories])

  const storeItems = items.filter(category => category.store === store).sort(byOrder)

  const patchLocal = (id: string, patch: Partial<Category>) =>
    setItems(current => current.map(category => (category.id === id ? { ...category, ...patch } : category)))

  const persist = async (id: string, patch: Partial<Category>, previous: Partial<Category>) => {
    setError('')
    patchLocal(id, patch)
    const { error: updateError } = await supabase.from('categories').update(patch).eq('id', id)
    if (updateError) {
      patchLocal(id, previous)
      setError(SAVE_FAILED)
    }
  }

  const addCategory = async (event: FormEvent) => {
    event.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    setError('')
    setSaving(true)
    const nextOrder = storeItems.reduce((highest, category) => Math.max(highest, category.sort_order), 0) + 1
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({ label, slug: slugify(label), sort_order: nextOrder, store })
      .select()
      .single()
    setSaving(false)
    if (insertError || !data) {
      setError(insertError?.code === '23505' ? 'A category with that name already exists.' : SAVE_FAILED)
      return
    }
    setItems(current => [...current, data])
    setNewLabel('')
  }

  const rename = (category: Category, label: string) => {
    const trimmed = label.trim()
    if (!trimmed || trimmed === category.label) return
    void persist(category.id, { label: trimmed }, { label: category.label })
  }

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= storeItems.length) return
    const reordered = [...storeItems]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const numbered = reordered.map((category, position) => ({ ...category, sort_order: position + 1 }))
    const changed = numbered.filter(category => category.sort_order !== storeItems.find(entry => entry.id === category.id)?.sort_order)

    setError('')
    const snapshot = items
    setItems(current => current.map(category => numbered.find(entry => entry.id === category.id) ?? category))
    const updates = await Promise.all(
      changed.map(category =>
        supabase.from('categories').update({ sort_order: category.sort_order }).eq('id', category.id)
      )
    )
    if (updates.some(update => update.error)) {
      setItems(snapshot)
      setError(SAVE_FAILED)
    }
  }

  const remove = async (category: Category) => {
    if (
      !window.confirm(
        `Delete "${category.label}"? Products in it keep their tag but the storefront filter disappears.`
      )
    )
      return
    setError('')
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', category.id)
    if (deleteError) {
      setError(SAVE_FAILED)
      return
    }
    setItems(current => current.filter(entry => entry.id !== category.id))
  }

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="text-body text-ink-muted">
        Reorder with the arrows, rename inline, and use the switch to show or hide a category in the
        storefront.
      </p>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-1">
        <SegmentTab active={store === 'restaurant'} onSelect={() => setStore('restaurant')}>
          Meals
        </SegmentTab>
        <SegmentTab active={store === 'supermarket'} onSelect={() => setStore('supermarket')}>
          Mart
        </SegmentTab>
      </div>

      <form onSubmit={addCategory} className="flex gap-2">
        <input
          value={newLabel}
          onChange={event => setNewLabel(event.target.value)}
          placeholder={store === 'restaurant' ? 'New menu category' : 'New Mart category'}
          aria-label="New category name"
          className="input flex-1"
        />
        <Button type="submit" loading={saving}>
          <Plus size={16} /> Add
        </Button>
      </form>

      <FormError message={error} />

      <ul className="flex flex-col gap-2">
        {storeItems.map((category, index) => (
          <li
            key={category.id}
            className={cn(
              'flex items-center gap-2 rounded-xl border border-line bg-white p-2 transition-opacity',
              !category.is_active && 'opacity-60'
            )}
          >
            <div className="flex shrink-0">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${category.label} up`}
                className="grid h-11 w-9 place-items-center rounded text-ink-muted hover:text-brand disabled:opacity-25"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === storeItems.length - 1}
                aria-label={`Move ${category.label} down`}
                className="grid h-11 w-9 place-items-center rounded text-ink-muted hover:text-brand disabled:opacity-25"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <input
              defaultValue={category.label}
              onBlur={event => rename(category, event.target.value)}
              aria-label={`Name of ${category.label}`}
              className="h-11 min-w-0 flex-1 border-b border-transparent bg-transparent font-medium outline-none focus:border-brand"
            />

            <span className="hidden text-label font-medium text-ink-muted sm:inline">
              {category.is_active ? 'Visible' : 'Hidden'}
            </span>
            <ToggleSwitch
              checked={category.is_active}
              onChange={visible => void persist(category.id, { is_active: visible }, { is_active: category.is_active })}
              label={category.is_active ? `Hide ${category.label}` : `Show ${category.label}`}
            />

            <button
              type="button"
              onClick={() => remove(category)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-danger hover:bg-danger/10"
              aria-label={`Delete ${category.label}`}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
