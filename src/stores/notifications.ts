import { create } from 'zustand'
import type { AppNotification } from '@/lib/types'

interface NotificationsState {
  items: AppNotification[]
  loading: boolean
  replace: (items: AppNotification[]) => void
  upsert: (notification: AppNotification) => void
  markRead: (ids: string[] | 'all') => void
  reset: () => void
}

export const useNotificationStore = create<NotificationsState>(set => ({
  items: [],
  loading: true,
  replace: items => set({ items, loading: false }),
  upsert: notification =>
    set(state => {
      const exists = state.items.some(item => item.id === notification.id)
      return {
        items: exists
          ? state.items.map(item => (item.id === notification.id ? notification : item))
          : [notification, ...state.items],
      }
    }),
  markRead: ids =>
    set(state => ({
      items: state.items.map(item =>
        ids === 'all' || ids.includes(item.id) ? { ...item, is_read: true } : item
      ),
    })),
  reset: () => set({ items: [], loading: false }),
}))

export const selectUnreadCount = (state: NotificationsState): number =>
  state.items.filter(item => !item.is_read).length
