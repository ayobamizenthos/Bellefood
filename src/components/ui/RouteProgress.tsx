'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function RouteProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const start = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return
      const anchor = (event.target as HTMLElement).closest('a')
      if (!anchor || anchor.target === '_blank' || anchor.origin !== location.origin) return
      if (anchor.pathname === location.pathname && anchor.search === location.search) return
      setActive(true)
      clearTimeout(timeout.current)
      timeout.current = setTimeout(() => setActive(false), 4000)
    }
    document.addEventListener('click', start, true)
    return () => document.removeEventListener('click', start, true)
  }, [])

  useEffect(() => {
    setActive(false)
    clearTimeout(timeout.current)
  }, [pathname])

  if (!active) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden bg-brand/15">
      <div className="h-full w-1/4 animate-progress-slide rounded-full bg-brand" />
    </div>
  )
}
