export function isRouteActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Accepts only same-origin paths, so a crafted `from` can never send a signed-in user off site. */
export function safeRedirectPath(candidate: string | null | undefined, fallback = '/'): string {
  if (!candidate || !candidate.startsWith('/')) return fallback
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return fallback
  return candidate
}

export function orderHref(orderId: string, isAdmin: boolean): string {
  return isAdmin ? `/admin/orders/${orderId}` : `/orders/${orderId}`
}

export function notificationHref(
  notification: { order_id: string | null },
  isAdmin: boolean
): string {
  return notification.order_id ? orderHref(notification.order_id, isAdmin) : '/notifications'
}
