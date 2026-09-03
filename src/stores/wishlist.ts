import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  ids: string[]
  has: (productId: string) => boolean
  toggle: (productId: string) => void
  remove: (productId: string) => void
  clear: () => void
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      has: productId => get().ids.includes(productId),
      toggle: productId =>
        set(state => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter(id => id !== productId)
            : [...state.ids, productId],
        })),
      remove: productId => set(state => ({ ids: state.ids.filter(id => id !== productId) })),
      clear: () => set({ ids: [] }),
    }),
    { name: 'bellefood-wishlist', skipHydration: true }
  )
)
