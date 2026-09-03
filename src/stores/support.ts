import { create } from 'zustand'

interface SupportState {
  open: boolean
  show: () => void
  hide: () => void
}

export const useSupportSheet = create<SupportState>(set => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}))
