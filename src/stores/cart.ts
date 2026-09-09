import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/lib/types'
import { cartItemKey, cartItemTotal } from '@/lib/types'
import { playAddToCart } from '@/lib/sounds'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  setQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
  clear: () => void
  subtotal: () => number
  count: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: item =>
        set(state => {
          playAddToCart()
          const key = cartItemKey(item)
          const existing = state.items.find(i => cartItemKey(i) === key)
          if (!existing) return { items: [...state.items, item] }

          return {
            items: state.items.map(i =>
              cartItemKey(i) === key ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          }
        }),

      setQuantity: (key, quantity) =>
        set(state => ({
          items: state.items.flatMap(i => {
            if (cartItemKey(i) !== key) return [i]
            if (quantity <= 0) return []
            return [{ ...i, quantity }]
          }),
        })),

      removeItem: key => set(state => ({ items: state.items.filter(i => cartItemKey(i) !== key) })),

      clear: () => set({ items: [] }),

      subtotal: () => get().items.reduce((sum, i) => sum + cartItemTotal(i), 0),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'bellefood-cart', skipHydration: true }
  )
)
