import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { useToasts } from '@/stores/toast'
import { playNotification } from '@/lib/sounds'
import type { AppNotification } from '@/lib/types'

export function NotificationWatcher() {
  const { session, isAdmin } = useAuth()
  const userId = session?.user.id
  const push = useToasts(s => s.push)

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notify-watch:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          const row = payload.new as AppNotification
          playNotification()
          const href = row.order_id
            ? isAdmin && row.type === 'new_order'
              ? `/admin/orders/${row.order_id}`
              : `/orders/${row.order_id}`
            : '/notifications'
          push({ title: row.title, message: row.message, href })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, isAdmin, push])

  return null
}
