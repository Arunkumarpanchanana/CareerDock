export type CanvasModuleType = 'resume' | 'job-search' | 'skill-insights' | 'interview-feedback' | 'expert-sessions'

export interface CanvasPosition {
  x: number
  y: number
}

export interface CanvasSize {
  width: number
  height: number
}

export interface CanvasModule {
  id: string
  type: CanvasModuleType
  title: string
  position: CanvasPosition
  size: CanvasSize
  minimized: boolean
}

export interface CareerPath {
  id: string
  name: string
  modules: string[]
  createdAt: string
  updatedAt: string
}

export interface CanvasState {
  paths: CareerPath[]
  modules: CanvasModule[]
  activePathId: string | null
  viewport: {
    x: number
    y: number
    zoom: number
  }
}
