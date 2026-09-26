import { describe, expect, it } from 'vitest'
import { revenueBuckets } from './revenue'

const now = new Date('2026-09-26T10:00:00Z')

describe('revenueBuckets', () => {
  it('builds seven daily buckets ending today', () => {
    const buckets = revenueBuckets([], '7d', '', '', now)
    expect(buckets).toHaveLength(7)
    expect(buckets.every(bucket => bucket.total === 0)).toBe(true)
  })

  it('counts a late-night order on its Lagos date, not the UTC one', () => {
    const buckets = revenueBuckets(
      [{ total: 5000, created_at: '2026-09-25T23:30:00Z' }],
      '7d',
      '',
      '',
      now
    )
    expect(buckets.at(-1)?.total).toBe(5000)
    expect(buckets.at(-2)?.total).toBe(0)
  })

  it('groups by month for the twelve month range', () => {
    const buckets = revenueBuckets(
      [
        { total: 1000, created_at: '2026-09-02T12:00:00Z' },
        { total: 2500, created_at: '2026-09-20T12:00:00Z' },
        { total: 700, created_at: '2025-10-15T12:00:00Z' },
      ],
      '12m',
      '',
      '',
      now
    )
    expect(buckets).toHaveLength(12)
    expect(buckets[0].total).toBe(700)
    expect(buckets.at(-1)?.total).toBe(3500)
  })

  it('orders a reversed custom range', () => {
    const buckets = revenueBuckets([], 'custom', '2026-09-10', '2026-09-01', now)
    expect(buckets).toHaveLength(10)
  })
})
