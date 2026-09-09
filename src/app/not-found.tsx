import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-white px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-6xl font-bold text-brand">404</span>
        <p className="text-lg font-semibold">Page not found</p>
        <p className="text-body text-ink-muted">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="mt-2 inline-flex h-[52px] items-center justify-center rounded-xl bg-brand px-6 text-lg font-semibold text-white transition-colors duration-250 hover:bg-brand-dark"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
