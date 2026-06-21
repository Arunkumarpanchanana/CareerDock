'use client'

import { useState, useCallback } from 'react'
import type { CanvasState, CanvasModule, CanvasModuleType } from '@/types/canvas'

const DEFAULT_STATE: CanvasState = {
  paths: [{ id: 'default', name: 'Main Path', modules: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
  modules: [],
  activePathId: 'default',
  viewport: { x: 0, y: 0, zoom: 1 },
}

export function useCanvasState() {
  const [state, setState] = useState<CanvasState>(DEFAULT_STATE)

  const addModule = useCallback((type: CanvasModuleType, title: string) => {
    const module: CanvasModule = {
      id: `mod-${Date.now()}`,
      type,
      title,
      position: { x: 100 + state.modules.length * 30, y: 100 + state.modules.length * 30 },
      size: { width: 320, height: 240 },
      minimized: false,
    }
    setState((prev) => ({
      ...prev,
      modules: [...prev.modules, module],
    }))
  }, [state.modules.length])

  const updateModulePosition = useCallback((id: string, x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === id ? { ...m, position: { x, y } } : m)),
    }))
  }, [])

  const toggleMinimize = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === id ? { ...m, minimized: !m.minimized } : m)),
    }))
  }, [])

  const removeModule = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id),
    }))
  }, [])

  const addPath = useCallback((name: string) => {
    const path = { id: `path-${Date.now()}`, name, modules: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setState((prev) => ({ ...prev, paths: [...prev.paths, path], activePathId: path.id }))
  }, [])

  const setActivePath = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activePathId: id }))
  }, [])

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, viewport: { ...prev.viewport, zoom: Math.max(0.25, Math.min(2, zoom)) } }))
  }, [])

  return { state, addModule, updateModulePosition, toggleMinimize, removeModule, addPath, setActivePath, setZoom }
}
