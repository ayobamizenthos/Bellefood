import { describe, expect, it } from 'vitest'
import { calculateTotals, kitchenSubtotal, redeemPoints } from './pricing'
import type { CartItem } from './types'

const jollof: CartItem = {
  productId: 'jollof',
  name: 'Jollof Rice & Chicken',
  image: null,
  category: 'rice',
  store: 'restaurant',
  isCombo: false,
  unitPrice: 4500,
  quantity: 2,
}

const cereal: CartItem = {
  productId: 'cornflakes',
  name: 'Cornflakes 500g',
  image: null,
  category: 'provisions',
  store: 'supermarket',
  isCombo: false,
  unitPrice: 3200,
  quantity: 1,
}

describe('calculateTotals', () => {
  it('adds the delivery fee below the free delivery threshold', () => {
    expect(calculateTotals([jollof, cereal], 1500, 100_000)).toEqual({
      subtotal: 12_200,
      deliveryFee: 1500,
      total: 13_700,
      qualifiesForFreeDelivery: false,
    })
  })

  it('waives delivery once the subtotal reaches the threshold', () => {
    const totals = calculateTotals([jollof], 1500, 9000)
    expect(totals.deliveryFee).toBe(0)
    expect(totals.total).toBe(9000)
    expect(totals.qualifiesForFreeDelivery).toBe(true)
  })
})

describe('kitchenSubtotal', () => {
  it('counts only restaurant items', () => {
    expect(kitchenSubtotal([jollof, cereal])).toBe(9000)
  })
})

describe('redeemPoints', () => {
  it('spends only the points needed to cover the eligible amount', () => {
    expect(redeemPoints(500, 100, 9000)).toEqual({ pointsUsed: 90, discount: 9000 })
  })

  it('rounds the points used up and caps the discount at the eligible amount', () => {
    expect(redeemPoints(500, 100, 9050)).toEqual({ pointsUsed: 91, discount: 9050 })
  })

  it('uses the whole balance when it does not cover the order', () => {
    expect(redeemPoints(12, 100, 9000)).toEqual({ pointsUsed: 12, discount: 1200 })
  })

  it('returns nothing without a balance or an eligible amount', () => {
    expect(redeemPoints(0, 100, 9000)).toEqual({ pointsUsed: 0, discount: 0 })
    expect(redeemPoints(50, 100, 0)).toEqual({ pointsUsed: 0, discount: 0 })
  })
})
