import { useEffect } from 'react'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { StoreSettings } from '@/lib/types'

interface StoreSettingsState {
  settings: StoreSettings | null
  loading: boolean
  request: Promise<void> | null
  load: (force?: boolean) => Promise<void>
}

const useStoreSettingsStore = create<StoreSettingsState>((set, get) => ({
  settings: null,
  loading: true,
  request: null,
  load: force => {
    const pending = get().request
    if (pending && !force) return pending
    const request = (async () => {
      const { data } = await supabase.from('store_settings').select('*').maybeSingle()
      set({ settings: data, loading: false })
    })()
    set({ request })
    return request
  },
}))

/** Store settings are fetched once per page load and shared by every caller. */
export function useStoreSettings() {
  const settings = useStoreSettingsStore(state => state.settings)
  const loading = useStoreSettingsStore(state => state.loading)
  const load = useStoreSettingsStore(state => state.load)

  useEffect(() => {
    void load()
  }, [load])

  const reload = () => load(true)
  return { settings, loading, reload }
}
