'use client'

import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggleVisible?: () => void
  autoComplete: 'current-password' | 'new-password'
}

export function PasswordInput({
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
}: PasswordInputProps) {
  const input = (
    <input
      type={visible ? 'text' : 'password'}
      required
      value={value}
      onChange={event => onChange(event.target.value)}
      className={onToggleVisible ? 'input pr-12' : 'input'}
      autoComplete={autoComplete}
    />
  )
  if (!onToggleVisible) return input

  return (
    <div className="relative">
      {input}
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-ink-muted"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
