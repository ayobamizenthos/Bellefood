import { describe, expect, it } from 'vitest'
import { formatNaira, lagosDayKey, lagosMonthKey, relativeTime } from './format'

describe('formatNaira', () => {
  it('formats whole naira without decimals', () => {
    expect(formatNaira(12_500)).toMatch(/^₦\s?12,500$/)
  })

  it('rounds kobo away', () => {
    expect(formatNaira(999.6)).toMatch(/^₦\s?1,000$/)
  })
})

describe('lagosDayKey', () => {
  it('moves late UTC evenings onto the next Lagos day', () => {
    expect(lagosDayKey('2026-03-31T23:30:00Z')).toBe('2026-04-01')
  })

  it('keeps daytime timestamps on the same day', () => {
    expect(lagosDayKey('2026-03-31T10:00:00Z')).toBe('2026-03-31')
  })

  it('derives the Lagos month from the Lagos day', () => {
    expect(lagosMonthKey('2026-03-31T23:30:00Z')).toBe('2026-04')
  })
})

describe('relativeTime', () => {
  const now = Date.parse('2026-09-26T12:00:00Z')

  it('describes recent moments', () => {
    expect(relativeTime('2026-09-26T11:59:40Z', now)).toBe('just now')
    expect(relativeTime('2026-09-26T11:45:00Z', now)).toBe('15m ago')
    expect(relativeTime('2026-09-26T09:00:00Z', now)).toBe('3h ago')
    expect(relativeTime('2026-09-24T12:00:00Z', now)).toBe('2d ago')
  })

  it('falls back to a date after a week', () => {
    expect(relativeTime('2026-09-01T12:00:00Z', now)).toMatch(/Sept?\s2026|1 Sep/)
  })
})
