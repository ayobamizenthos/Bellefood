'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BrandPulse } from './BrandLoader'

// Fast client transitions never show the overlay; slow ones keep it up long enough not to flicker.
const SHOW_DELAY_MS = 180
const MIN_VISIBLE_MS = 300
const MAX_VISIBLE_MS = 5000

export function NavLoadingOverlay() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const shownAt = useRef(0)
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const previousPath = useRef(pathname)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest('a')
      if (!anchor || anchor.target === '_blank' || anchor.origin !== location.origin) return
      const target = new URL(anchor.href)
      if (target.pathname === location.pathname && target.search === location.search) return
      clearTimeout(showTimer.current)
      showTimer.current = setTimeout(() => {
        shownAt.current = Date.now()
        setVisible(true)
      }, SHOW_DELAY_MS)
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      clearTimeout(showTimer.current)
    }
  }, [])

  useEffect(() => {
    if (pathname === previousPath.current) return
    previousPath.current = pathname
    clearTimeout(showTimer.current)
    if (!visible) return
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current))
    const timer = setTimeout(() => setVisible(false), remaining)
    return () => clearTimeout(timer)
  }, [pathname, visible])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), MAX_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[80] grid animate-fade-in place-items-center bg-white/85 backdrop-blur-sm">
      <BrandPulse />
    </div>
  )
}
