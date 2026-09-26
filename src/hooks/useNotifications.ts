import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { selectUnreadCount, useNotificationStore } from '@/stores/notifications'

/** Reads the inbox that NotificationWatcher keeps in sync; it opens no channel of its own. */
export function useNotifications() {
  const items = useNotificationStore(state => state.items)
  const loading = useNotificationStore(state => state.loading)
  const unreadCount = useNotificationStore(selectUnreadCount)
  const markReadLocally = useNotificationStore(state => state.markRead)

  const markAllRead = useCallback(async () => {
    markReadLocally('all')
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
  }, [markReadLocally])

  const markRead = useCallback(
    async (id: string) => {
      markReadLocally([id])
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    },
    [markReadLocally]
  )

  return { items, loading, unreadCount, markAllRead, markRead }
}
