'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const MIN_VISIBLE_MS = 550

export function NavLoadingOverlay() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const shownAt = useRef(0)
  const prevPath = useRef(pathname)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement).closest('a')
      if (!anchor || anchor.target === '_blank' || anchor.origin !== location.origin) return
      const target = new URL(anchor.href)
      if (target.pathname === location.pathname && target.search === location.search) return
      shownAt.current = Date.now()
      setVisible(true)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    if (!visible) return
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current))
    const timer = setTimeout(() => setVisible(false), remaining)
    return () => clearTimeout(timer)
  }, [pathname, visible])

  useEffect(() => {
    if (!visible) return
    const safety = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(safety)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[80] grid animate-fade-in place-items-center bg-white/85 backdrop-blur-sm">
      <div className="relative grid place-items-center">
        <span className="absolute h-20 w-20 animate-ping rounded-2xl bg-brand/20" />
        <Image
          src="/bellefood-mark.png"
          alt="Loading"
          width={64}
          height={64}
          priority
          className="relative h-16 w-16 animate-logo-pulse"
        />
      </div>
    </div>
  )
}
