import { create } from 'zustand'

export interface Toast {
  id: string
  title: string
  message: string
  href?: string
}

interface ToastState {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToasts = create<ToastState>(set => ({
  toasts: [],
  push: toast => {
    const id = crypto.randomUUID()
    set(state => ({ toasts: [{ ...toast, id }, ...state.toasts].slice(0, 3) }))
    setTimeout(() => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })), 6000)
  },
  dismiss: id => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}))
