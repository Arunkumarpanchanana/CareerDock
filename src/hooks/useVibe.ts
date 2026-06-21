'use client'

import { useCallback, useState, useEffect } from 'react'

export type Vibe = 'confident' | 'strategic' | 'growth' | 'bold'

export interface VibeConfig {
  id: Vibe
  label: string
  color: string
  description: string
}

export const VIBES: VibeConfig[] = [
  { id: 'confident', label: 'Confident', color: '#6366f1', description: 'Bold language, leadership focus' },
  { id: 'strategic', label: 'Strategic', color: '#10b981', description: 'Data-driven, impact metrics' },
  { id: 'growth', label: 'Growth', color: '#f59e0b', description: 'Learning-focused, potential emphasis' },
  { id: 'bold', label: 'Bold', color: '#f43f5e', description: 'Disruptive, innovative language' },
]

function getStoredVibe(): Vibe {
  if (typeof window === 'undefined') return 'confident'
  return (localStorage.getItem('careerdock-vibe') as Vibe) || 'confident'
}

export function useVibe() {
  const [vibe, setVibeState] = useState<Vibe>('confident')

  useEffect(() => {
    setVibeState(getStoredVibe())
  }, [])

  const setVibe = useCallback((v: Vibe) => {
    setVibeState(v)
    localStorage.setItem('careerdock-vibe', v)
    const config = VIBES.find((vb) => vb.id === v)
    if (config) {
      document.documentElement.style.setProperty('--accent', config.color)
      document.documentElement.style.setProperty('--accent-hover', config.color + 'dd')
      document.documentElement.style.setProperty('--glass-glow', config.color + '26')
    }
  }, [])

  return { vibe, setVibe, config: VIBES.find((v) => v.id === vibe) ?? VIBES[0], vibes: VIBES }
}
