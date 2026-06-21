import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean
  hover?: boolean
}

export function Card({ padding = true, hover = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-sm ${
        padding ? 'p-6' : ''
      } ${
        hover ? 'transition-all duration-200 hover:shadow-[var(--glass-glow)] hover:border-[var(--accent)]/30' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--text-primary)] ${className}`} {...props}>
      {children}
    </h3>
  )
}
