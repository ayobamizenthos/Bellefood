'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useCategories, type Category } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { Button } from '@/components/ui/Button'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { cn } from '@/lib/cn'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function AdminCategories() {
  const { categories, loading } = useCategories(true)
  const [items, setItems] = useState<Category[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const seeded = useRef(false)

  useEffect(() => {
    if (!seeded.current && categories.length) {
      setItems(categories)
      seeded.current = true
    }
  }, [categories])

  const add = async () => {
    const label = newLabel.trim()
    if (!label) return
    setSaving(true)
    const { data } = await supabase
      .from('categories')
      .insert({ label, slug: slugify(label), sort_order: items.length })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data])
    setNewLabel('')
    setSaving(false)
  }

  const rename = (id: string, label: string) => {
    setItems(prev => prev.map(category => (category.id === id ? { ...category, label } : category)))
    void supabase.from('categories').update({ label }).eq('id', id)
  }

  const toggleActive = (id: string) => {
    setItems(prev => {
      const nextActive = !prev.find(category => category.id === id)?.is_active
      void supabase.from('categories').update({ is_active: nextActive }).eq('id', id)
      return prev.map(category =>
        category.id === id ? { ...category, is_active: nextActive } : category
      )
    })
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    ;[index, target].forEach(position => {
      void supabase.from('categories').update({ sort_order: position }).eq('id', next[position].id)
    })
  }

  const remove = (id: string, label: string) => {
    if (
      !window.confirm(
        `Delete "${label}"? Products in it keep their tag but the storefront filter disappears.`
      )
    )
      return
    setItems(prev => prev.filter(category => category.id !== id))
    void supabase.from('categories').delete().eq('id', id)
  }

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="text-body text-ink-muted">
        Reorder with the arrows, rename inline, and use the switch to show or hide a category in the
        storefront.
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
        {items.map((category, index) => (
          <div
            key={category.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition-opacity',
              !category.is_active && 'opacity-60'
            )}
          >
            <div className="flex shrink-0 flex-col">
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="grid h-5 w-6 place-items-center rounded text-ink-muted hover:text-brand disabled:opacity-25"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="grid h-5 w-6 place-items-center rounded text-ink-muted hover:text-brand disabled:opacity-25"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <input
              defaultValue={category.label}
              onBlur={e => rename(category.id, e.target.value)}
              className="min-w-0 flex-1 border-b border-transparent bg-transparent font-medium outline-none focus:border-brand"
            />

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-label font-medium text-ink-muted">
                {category.is_active ? 'Visible' : 'Hidden'}
              </span>
              <ToggleSwitch
                checked={category.is_active}
                onChange={() => toggleActive(category.id)}
                label={category.is_active ? 'Hide category' : 'Show category'}
              />
            </div>

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
