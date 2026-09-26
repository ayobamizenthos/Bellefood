import { describe, expect, it } from 'vitest'
import { isRouteActive, notificationHref, safeRedirectPath } from './routes'

describe('safeRedirectPath', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirectPath('/checkout')).toBe('/checkout')
    expect(safeRedirectPath('/orders/abc?placed=1')).toBe('/orders/abc?placed=1')
  })

  it('rejects anything that could leave the site', () => {
    expect(safeRedirectPath('https://evil.example')).toBe('/')
    expect(safeRedirectPath('//evil.example')).toBe('/')
    expect(safeRedirectPath('/\\evil.example')).toBe('/')
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/')
  })

  it('falls back when nothing is given', () => {
    expect(safeRedirectPath(null)).toBe('/')
    expect(safeRedirectPath('', '/account')).toBe('/account')
  })
})

describe('isRouteActive', () => {
  it('matches nested routes unless exact', () => {
    expect(isRouteActive('/admin/orders/1', '/admin/orders')).toBe(true)
    expect(isRouteActive('/admin/orders', '/admin', true)).toBe(false)
    expect(isRouteActive('/admin-tools', '/admin')).toBe(false)
  })
})

describe('notificationHref', () => {
  it('sends admins to the admin order page', () => {
    expect(notificationHref({ order_id: 'o1' }, true)).toBe('/admin/orders/o1')
    expect(notificationHref({ order_id: 'o1' }, false)).toBe('/orders/o1')
    expect(notificationHref({ order_id: null }, false)).toBe('/notifications')
  })
})
