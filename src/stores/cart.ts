import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/lib/types'
import { MAX_ITEM_QUANTITY, cartItemTotal } from '@/lib/types'
import { playAddToCart } from '@/lib/sounds'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  setQuantity: (productId: string, quantity: number) => void
  replaceItems: (items: CartItem[]) => void
  removeItem: (productId: string) => void
  clear: () => void
}

const clampQuantity = (quantity: number) => Math.min(quantity, MAX_ITEM_QUANTITY)

export const useCart = create<CartState>()(
  persist(
    set => ({
      items: [],

      addItem: item => {
        playAddToCart()
        set(state => {
          const existing = state.items.find(entry => entry.productId === item.productId)
          if (!existing) {
            return { items: [...state.items, { ...item, quantity: clampQuantity(item.quantity) }] }
          }
          return {
            items: state.items.map(entry =>
              entry.productId === item.productId
                ? { ...entry, quantity: clampQuantity(entry.quantity + item.quantity) }
                : entry
            ),
          }
        })
      },

      setQuantity: (productId, quantity) =>
        set(state => ({
          items: state.items.flatMap(entry => {
            if (entry.productId !== productId) return [entry]
            if (quantity <= 0) return []
            return [{ ...entry, quantity: clampQuantity(quantity) }]
          }),
        })),

      replaceItems: items => set({ items }),

      removeItem: productId =>
        set(state => ({ items: state.items.filter(entry => entry.productId !== productId) })),

      clear: () => set({ items: [] }),
    }),
    { name: 'bellefood-cart', skipHydration: true }
  )
)

export const selectCartCount = (state: CartState): number =>
  state.items.reduce((sum, entry) => sum + entry.quantity, 0)

export const selectCartSubtotal = (state: CartState): number =>
  state.items.reduce((sum, entry) => sum + cartItemTotal(entry), 0)
