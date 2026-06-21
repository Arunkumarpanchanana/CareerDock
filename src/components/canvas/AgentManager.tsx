'use client'

import { Plus, Check, X } from 'lucide-react'
import { useState } from 'react'
import type { CareerPath } from '@/types/canvas'

interface AgentManagerProps {
  paths: CareerPath[]
  activePathId: string | null
  onSelectPath: (id: string) => void
  onAddPath: (name: string) => void
}

export function AgentManager({ paths, activePathId, onSelectPath, onAddPath }: AgentManagerProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  return (
    <div className="w-60 border-l border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Paths</h3>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {paths.map((path) => (
          <button
            key={path.id}
            onClick={() => onSelectPath(path.id)}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
              path.id === activePathId
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              {path.id === activePathId && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
              <span className="truncate">{path.name}</span>
            </div>
          </button>
        ))}
      </div>
      {adding ? (
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Path name..."
            className="flex-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { onAddPath(name.trim()); setName(''); setAdding(false) } }}
          />
          <button onClick={() => setAdding(false)} className="p-1.5 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Path
        </button>
      )}
    </div>
  )
}
