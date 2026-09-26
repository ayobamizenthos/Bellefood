import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  ids: string[]
  toggle: (productId: string) => void
}

export const useWishlist = create<WishlistState>()(
  persist(
    set => ({
      ids: [],
      toggle: productId =>
        set(state => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter(id => id !== productId)
            : [...state.ids, productId],
        })),
    }),
    { name: 'bellefood-wishlist', skipHydration: true }
  )
)
