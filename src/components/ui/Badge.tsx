import type { ReactNode } from 'react'

type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/25',
  success: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/25',
  warning: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/25',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/25',
  neutral: 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)]',
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
