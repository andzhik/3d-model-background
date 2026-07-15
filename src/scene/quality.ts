export type SceneQuality = 'high' | 'medium' | 'low' | 'poster-only'

export interface SceneQualitySettings {
  dpr: [number, number]
  antialias: boolean
  shadows: boolean
}

export const SCENE_QUALITY: Record<SceneQuality, SceneQualitySettings> = {
  high: { dpr: [1, 1.5], antialias: true, shadows: true },
  medium: { dpr: [1, 1.25], antialias: true, shadows: false },
  low: { dpr: [1, 1], antialias: false, shadows: false },
  'poster-only': { dpr: [1, 1], antialias: false, shadows: false },
}

export const DEFAULT_SCENE_QUALITY: SceneQuality = 'high'
