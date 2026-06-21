'use client'

interface VibeChipProps {
  label: string
  active?: boolean
  color: string
  onClick?: () => void
}

export function VibeChip({ label, active = false, color, onClick }: VibeChipProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium border transition-all duration-300 ${
        active
          ? 'shadow-lg'
          : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--glass-bg)] backdrop-blur-sm'
      }`}
      style={active ? { borderColor: color, backgroundColor: `${color}25`, color } : undefined}
    >
      {label}
    </button>
  )
}
