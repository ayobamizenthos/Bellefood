import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonStyle {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyle {
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark active:bg-brand-dark',
  secondary: 'border border-brand text-brand bg-white hover:bg-brand-tint',
  ghost: 'text-ink hover:bg-line/60',
  danger: 'bg-danger text-white hover:brightness-95',
}

const sizes: Record<Size, string> = {
  sm: 'h-11 px-3 text-body',
  md: 'h-11 px-5 text-body',
  lg: 'h-[52px] px-6 text-lg',
}

/** Button styling for elements that must stay links, such as a call to action that navigates. */
export function buttonClassName({ variant = 'primary', size = 'md', fullWidth }: ButtonStyle = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-250',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full'
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, fullWidth, className, children, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(buttonClassName({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
