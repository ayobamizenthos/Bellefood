import { describe, expect, it } from 'vitest'
import { slugify } from './text'

describe('slugify', () => {
  it('turns names into url slugs', () => {
    expect(slugify('Amala & Ewedu')).toBe('amala-ewedu')
    expect(slugify('  Bottled Water 75cl ')).toBe('bottled-water-75cl')
    expect(slugify('---')).toBe('')
  })
})
