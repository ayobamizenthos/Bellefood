import { useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { useToasts } from '@/stores/toast'
import { usePreferences } from '@/stores/preferences'
import { playAdminAlert, playCustomerAlert } from '@/lib/sounds'
import type { AppNotification } from '@/lib/types'

const lastAlertKey = (userId: string) => `bellefood-last-alert:${userId}`

export function NotificationWatcher() {
  const { session, isAdmin } = useAuth()
  const userId = session?.user.id
  const push = useToasts(s => s.push)

  const hrefFor = useCallback(
    (row: AppNotification) =>
      row.order_id
        ? isAdmin
          ? `/admin/orders/${row.order_id}`
          : `/orders/${row.order_id}`
        : '/notifications',
    [isAdmin]
  )

  const alert = useCallback(
    (row?: AppNotification) => {
      if (isAdmin) playAdminAlert(row?.title ?? 'You have a new order')
      else playCustomerAlert(row?.title)
    },
    [isAdmin]
  )

  // Fire the sound + cards for anything that arrived while the app was closed,
  // backgrounded, or offline — the moment it becomes visible again.
  const catchUp = useCallback(async () => {
    if (!userId || document.visibilityState !== 'visible') return
    if (!usePreferences.getState().alertsEnabled) return
    const since = localStorage.getItem(lastAlertKey(userId))
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(30)
    const fresh = (data ?? []).filter(row => !since || row.created_at > since)
    if (fresh.length === 0) return
    localStorage.setItem(lastAlertKey(userId), fresh[0].created_at)
    alert(
      fresh.length === 1
        ? fresh[0]
        : ({ title: fresh.length + ' new ' + (isAdmin ? 'orders' : 'updates') } as AppNotification)
    )
    if (fresh.length === 1) {
      push({ title: fresh[0].title, message: fresh[0].message, href: hrefFor(fresh[0]) })
    } else {
      push({
        title: `${fresh.length} new ${isAdmin ? 'orders' : 'updates'}`,
        message: isAdmin ? 'Tap to attend to them now.' : 'Tap to see your latest orders.',
        href: isAdmin ? '/admin/orders' : '/orders',
      })
    }
  }, [userId, isAdmin, push, hrefFor, alert])

  useEffect(() => {
    if (!userId) return

    void catchUp()

    const channel = supabase
      .channel(`notify-watch:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          if (!usePreferences.getState().alertsEnabled) return
          const row = payload.new as AppNotification
          localStorage.setItem(lastAlertKey(userId), row.created_at)
          alert(row)
          push({ title: row.title, message: row.message, href: hrefFor(row) })
        }
      )
      .subscribe()

    const onVisible = () => void catchUp()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [userId, push, hrefFor, alert, catchUp])

  return null
}
