import { SCENE_PALETTE } from './palette'

export const SCENE_SEED = 0x1e4d_2026

export const CAMERA_CONFIG = {
  position: [0, 0, 5] as const,
  fov: 42,
  near: 0.1,
  far: 100,
} as const

export const FOG_CONFIG = {
  color: SCENE_PALETTE.fog,
  near: 8,
  far: 34,
} as const

export const LIGHT_CONFIG = {
  hemisphereIntensity: 1.8,
  ambientIntensity: 0.55,
  keyIntensity: 2.4,
  keyPosition: [3, 4, 5] as const,
} as const

export const ATMOSPHERE_CONFIG = {
  sky: {
    position: [0, 0, -20] as const,
    size: [80, 40] as const,
  },
  sun: {
    position: [0, -1.45, -12] as const,
    radius: 1.15,
    segments: 48,
  },
  clouds: {
    wrapMinimum: -16,
    wrapMaximum: 16,
    far: {
      count: 7,
      seedOffset: 0x0f_a4,
      z: -10,
      xRange: [-14, 14] as const,
      yRange: [-0.1, 3.6] as const,
      scaleRange: [0.65, 1.2] as const,
      speed: 0.018,
      opacity: 0.38,
    },
    near: {
      count: 5,
      seedOffset: 0x2b_19,
      z: -5,
      xRange: [-13, 13] as const,
      yRange: [0.15, 3.15] as const,
      scaleRange: [0.8, 1.35] as const,
      speed: 0.038,
      opacity: 0.5,
    },
  },
} as const

export const MAJOR_GROUPS = [
  'environment',
  'distantWorld',
  'middleWorld',
  'foreground',
] as const

export type MajorGroup = (typeof MAJOR_GROUPS)[number]
