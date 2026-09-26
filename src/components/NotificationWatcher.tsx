'use client'

import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { useToasts } from '@/stores/toast'
import { usePreferences } from '@/stores/preferences'
import { useNotificationStore } from '@/stores/notifications'
import { playAdminAlert, playCustomerAlert } from '@/lib/sounds'
import { notificationHref } from '@/lib/routes'
import type { AppNotification } from '@/lib/types'

const INBOX_SIZE = 50
const lastAlertKey = (userId: string) => `bellefood-last-alert:${userId}`

function readMarker(userId: string): string | null {
  try {
    return localStorage.getItem(lastAlertKey(userId))
  } catch {
    return null
  }
}

function writeMarker(userId: string, createdAt: string) {
  try {
    localStorage.setItem(lastAlertKey(userId), createdAt)
  } catch {
    return
  }
}

/** Owns the only notifications channel: keeps the inbox store current and sounds new alerts. */
export function NotificationWatcher() {
  const { userId, isAdmin } = useAuth()
  const pushToast = useToasts(state => state.push)
  const replaceInbox = useNotificationStore(state => state.replace)
  const upsertNotification = useNotificationStore(state => state.upsert)
  const resetInbox = useNotificationStore(state => state.reset)
  const catchingUp = useRef(false)

  const announce = useCallback(
    (notification: AppNotification) => {
      if (isAdmin) playAdminAlert(notification.title)
      else playCustomerAlert(notification.title)
      pushToast({
        title: notification.title,
        message: notification.message,
        href: notificationHref(notification, isAdmin),
      })
    },
    [isAdmin, pushToast]
  )

  const announceBacklog = useCallback(
    (count: number) => {
      const noun = isAdmin ? 'orders' : 'updates'
      if (isAdmin) playAdminAlert(`${count} new ${noun}`)
      else playCustomerAlert(`${count} new ${noun}`)
      pushToast({
        title: `${count} new ${noun}`,
        message: isAdmin ? 'Tap to attend to them now.' : 'Tap to see your latest orders.',
        href: isAdmin ? '/admin/orders' : '/orders',
      })
    },
    [isAdmin, pushToast]
  )

  const syncInbox = useCallback(async () => {
    if (!userId || catchingUp.current) return
    catchingUp.current = true
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(INBOX_SIZE)
      const inbox = data ?? []
      replaceInbox(inbox)

      const newest = inbox[0]?.created_at
      const marker = readMarker(userId)
      if (!marker) {
        writeMarker(userId, newest ?? new Date().toISOString())
        return
      }
      const unseen = inbox.filter(item => !item.is_read && item.created_at > marker)
      if (unseen.length === 0) return
      writeMarker(userId, unseen[0].created_at)
      if (!usePreferences.getState().alertsEnabled) return
      if (unseen.length === 1) announce(unseen[0])
      else announceBacklog(unseen.length)
    } finally {
      catchingUp.current = false
    }
  }, [userId, replaceInbox, announce, announceBacklog])

  useEffect(() => {
    if (!userId) {
      resetInbox()
      return
    }

    void syncInbox()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          const notification = payload.new as AppNotification
          upsertNotification(notification)
          writeMarker(userId, notification.created_at)
          if (usePreferences.getState().alertsEnabled) announce(notification)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => upsertNotification(payload.new as AppNotification)
      )
      .subscribe()

    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') void syncInbox()
    }
    document.addEventListener('visibilitychange', syncWhenVisible)
    window.addEventListener('online', syncWhenVisible)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', syncWhenVisible)
      window.removeEventListener('online', syncWhenVisible)
    }
  }, [userId, syncInbox, upsertNotification, resetInbox, announce])

  return null
}
