import { useCallback, useEffect, useId, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import type { AppNotification } from '@/lib/types'

export function useNotifications() {
  const { session } = useAuth()
  const userId = session?.user.id
  const instanceId = useId()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setItems([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setItems(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [payload.new as AppNotification, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as AppNotification
            setItems(prev => prev.map(n => (n.id === updated.id ? updated : n)))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, load, instanceId])

  const unreadCount = items.filter(n => !n.is_read).length

  const markAllRead = useCallback(async () => {
    if (!userId) return
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
  }, [userId])

  const markRead = useCallback(async (id: string) => {
    setItems(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }, [])

  return { items, loading, unreadCount, markAllRead, markRead, reload: load }
}
