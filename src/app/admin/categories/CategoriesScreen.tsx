'use client'

import { useState } from 'react'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function AdminCategories() {
  const { categories, loading, reload } = useCategories(true)
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const add = async () => {
    const label = newLabel.trim()
    if (!label) return
    setSaving(true)
    await supabase.from('categories').insert({
      label,
      slug: slugify(label),
      sort_order: categories.length + 1,
    })
    setNewLabel('')
    setSaving(false)
    reload()
  }

  const rename = async (id: string, label: string) => {
    await supabase.from('categories').update({ label }).eq('id', id)
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('categories').update({ is_active: !isActive }).eq('id', id)
    reload()
  }

  const remove = async (id: string, label: string) => {
    if (
      !window.confirm(
        `Delete "${label}"? Products in it will keep their tag but the filter disappears.`
      )
    )
      return
    await supabase.from('categories').delete().eq('id', id)
    reload()
  }

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="text-body text-ink-muted">
        Add any product category. New categories appear instantly in the storefront filters and the
        home page grid.
      </p>

      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="New category name"
          className="input flex-1"
        />
        <Button loading={saving} onClick={add}>
          <Plus size={16} /> Add
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {categories.map(category => (
          <div
            key={category.id}
            className={cn(
              'flex items-center gap-2 rounded-xl border bg-white p-3',
              category.is_active ? 'border-line' : 'border-line/60 opacity-60'
            )}
          >
            <GripVertical size={16} className="shrink-0 text-ink-muted" />
            <input
              defaultValue={category.label}
              onBlur={e => rename(category.id, e.target.value)}
              className="min-w-0 flex-1 border-b border-transparent bg-transparent font-medium outline-none focus:border-brand"
            />
            <button
              onClick={() => toggleActive(category.id, category.is_active)}
              className={cn(
                'rounded-full px-3 py-1 text-label font-semibold',
                category.is_active ? 'bg-success/10 text-success' : 'bg-line text-ink-muted'
              )}
            >
              {category.is_active ? 'Active' : 'Hidden'}
            </button>
            <button
              onClick={() => remove(category.id, category.label)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-danger hover:bg-danger/10"
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
