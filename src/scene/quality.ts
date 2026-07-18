export const SCENE_QUALITY_TIERS = [
  'high',
  'medium',
  'low',
  'poster-only',
] as const

export type SceneQuality = (typeof SCENE_QUALITY_TIERS)[number]

export interface SceneQualitySettings {
  dpr: [number, number]
  antialias: boolean
  shadows: boolean
  vegetation: {
    farTrees: number
    nearTrees: number
    plants: number
  }
  water: {
    widthSegments: number
    lengthSegments: number
    amplitudeMultiplier: number
    animated: boolean
  }
  effects: {
    nearClouds: boolean
    sunReflection: boolean
  }
}

export const SCENE_QUALITY: Record<SceneQuality, SceneQualitySettings> = {
  high: {
    dpr: [1, 1.5],
    antialias: true,
    shadows: true,
    vegetation: { farTrees: 72, nearTrees: 42, plants: 54 },
    water: {
      widthSegments: 48,
      lengthSegments: 64,
      amplitudeMultiplier: 1,
      animated: true,
    },
    effects: { nearClouds: true, sunReflection: true },
  },
  medium: {
    dpr: [1, 1.25],
    antialias: true,
    shadows: false,
    vegetation: { farTrees: 48, nearTrees: 28, plants: 36 },
    water: {
      widthSegments: 32,
      lengthSegments: 40,
      amplitudeMultiplier: 0.8,
      animated: true,
    },
    effects: { nearClouds: true, sunReflection: true },
  },
  low: {
    dpr: [1, 1],
    antialias: false,
    shadows: false,
    vegetation: { farTrees: 24, nearTrees: 14, plants: 18 },
    water: {
      widthSegments: 16,
      lengthSegments: 20,
      amplitudeMultiplier: 0.45,
      animated: false,
    },
    effects: { nearClouds: false, sunReflection: true },
  },
  'poster-only': {
    dpr: [1, 1],
    antialias: false,
    shadows: false,
    vegetation: { farTrees: 0, nearTrees: 0, plants: 0 },
    water: {
      widthSegments: 0,
      lengthSegments: 0,
      amplitudeMultiplier: 0,
      animated: false,
    },
    effects: { nearClouds: false, sunReflection: false },
  },
}

export interface CapabilitySnapshot {
  webgl: boolean
  saveData: boolean
  hardwareConcurrency?: number
  deviceMemory?: number
}

export function isSceneQuality(value: string | null): value is SceneQuality {
  return SCENE_QUALITY_TIERS.some((tier) => tier === value)
}

/** `?quality=` is intentionally stable so QA can force the same tier in any build. */
export function getForcedQualityTier(search: string): SceneQuality | null {
  const value = new URLSearchParams(search).get('quality')
  return isSceneQuality(value) ? value : null
}

/**
 * Starts conservatively and lets sustained frame measurements promote capable
 * devices. No browser or operating-system identity is used.
 */
export function selectInitialQualityTier(
  capability: CapabilitySnapshot,
): SceneQuality {
  if (!capability.webgl || capability.saveData) return 'poster-only'

  const { deviceMemory, hardwareConcurrency } = capability
  if (
    (deviceMemory !== undefined && deviceMemory <= 4) ||
    (hardwareConcurrency !== undefined && hardwareConcurrency <= 4)
  ) {
    return 'low'
  }
  if (
    deviceMemory !== undefined &&
    hardwareConcurrency !== undefined &&
    deviceMemory >= 8 &&
    hardwareConcurrency >= 8
  ) {
    return 'high'
  }
  return 'medium'
}

/** One-step hysteresis avoids jumping directly between the most distant tiers. */
export function recommendRuntimeQuality(
  current: Exclude<SceneQuality, 'poster-only'>,
  averageFps: number,
): SceneQuality {
  if (!Number.isFinite(averageFps) || averageFps <= 0) return current

  if (current === 'high') return averageFps < 48 ? 'medium' : current
  if (current === 'medium') {
    if (averageFps < 34) return 'low'
    return averageFps >= 57 ? 'high' : current
  }
  if (averageFps < 20) return 'poster-only'
  return averageFps >= 50 ? 'medium' : current
}

export const DEFAULT_SCENE_QUALITY: SceneQuality = 'medium'
