import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="input-label">{label}</span>
      {children}
      {hint && <span className="text-label text-ink-muted">{hint}</span>}
    </label>
  )
}

export function FormError({ message }: { message: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">
      {message}
    </p>
  )
}
