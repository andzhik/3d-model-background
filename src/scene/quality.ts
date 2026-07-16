export type SceneQuality = 'high' | 'medium' | 'low' | 'poster-only'

export interface SceneQualitySettings {
  dpr: [number, number]
  antialias: boolean
  shadows: boolean
  vegetation: {
    farTrees: number
    nearTrees: number
    plants: number
  }
}

export const SCENE_QUALITY: Record<SceneQuality, SceneQualitySettings> = {
  high: {
    dpr: [1, 1.5],
    antialias: true,
    shadows: true,
    vegetation: { farTrees: 72, nearTrees: 42, plants: 54 },
  },
  medium: {
    dpr: [1, 1.25],
    antialias: true,
    shadows: false,
    vegetation: { farTrees: 48, nearTrees: 28, plants: 36 },
  },
  low: {
    dpr: [1, 1],
    antialias: false,
    shadows: false,
    vegetation: { farTrees: 24, nearTrees: 14, plants: 18 },
  },
  'poster-only': {
    dpr: [1, 1],
    antialias: false,
    shadows: false,
    vegetation: { farTrees: 0, nearTrees: 0, plants: 0 },
  },
}

export const DEFAULT_SCENE_QUALITY: SceneQuality = 'high'
