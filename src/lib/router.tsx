'use client'

import NextLink from 'next/link'
import {
  usePathname,
  useRouter,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from 'next/navigation'
import { forwardRef, useEffect, useMemo } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  replace?: boolean
  prefetch?: boolean
  state?: unknown
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, state: _state, prefetch, replace, ...rest },
  ref
) {
  return <NextLink ref={ref} href={to} replace={replace} prefetch={prefetch} {...rest} />
})

type NavClassState = { isActive: boolean }

type NavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
  to: string
  end?: boolean
  className?: string | ((state: NavClassState) => string)
  children?: ReactNode | ((state: NavClassState) => ReactNode)
}

export function NavLink({ to, end, className, children, ...rest }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className
  const resolvedChildren = typeof children === 'function' ? children({ isActive }) : children
  return (
    <NextLink
      href={to}
      className={resolvedClass}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {resolvedChildren}
    </NextLink>
  )
}

type NavigateTo = string | number

export function useNavigate() {
  const router = useRouter()
  return (to: NavigateTo, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      if (to < 0) router.back()
      else router.forward()
      return
    }
    if (options?.replace) router.replace(to)
    else router.push(to)
  }
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): Partial<T> {
  return useNextParams() as Partial<T>
}

export function useLocation() {
  const pathname = usePathname()
  const searchParams = useNextSearchParams()
  const search = searchParams.toString()
  return { pathname, search: search ? `?${search}` : '', hash: '', state: null }
}

type SearchParamsInput = URLSearchParams | Record<string, string>

export function useSearchParams(): [
  URLSearchParams,
  (next: SearchParamsInput | ((current: URLSearchParams) => SearchParamsInput)) => void,
] {
  const searchParams = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const current = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams])

  const setSearchParams = (
    next: SearchParamsInput | ((current: URLSearchParams) => SearchParamsInput)
  ) => {
    const resolved = typeof next === 'function' ? next(new URLSearchParams(current)) : next
    const params = resolved instanceof URLSearchParams ? resolved : new URLSearchParams(resolved)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return [current, setSearchParams]
}

export function Navigate({ to, replace }: { to: string; replace?: boolean; state?: unknown }) {
  const router = useRouter()
  useEffect(() => {
    if (replace) router.replace(to)
    else router.push(to)
  }, [to, replace, router])
  return null
}
