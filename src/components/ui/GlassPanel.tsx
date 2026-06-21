'use client'

import type { HTMLAttributes, ReactNode } from 'react'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean
  hover?: boolean
  glow?: boolean
  children: ReactNode
}

export function GlassPanel({ padding = true, hover = false, glow = false, className = '', children, ...props }: GlassPanelProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-lg ${
        padding ? 'p-6' : ''
      } ${
        hover ? 'transition-all duration-200 hover:shadow-[var(--glass-glow)] hover:border-[var(--accent)]/30' : ''
      } ${
        glow ? 'shadow-[var(--glass-glow)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
