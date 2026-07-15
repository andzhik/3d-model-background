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

export const PLACEHOLDER_CONFIG = {
  radius: 1.05,
  detail: 1,
  rotation: [0.28, 0.58, 0] as const,
} as const

export const MAJOR_GROUPS = [
  'environment',
  'distantWorld',
  'middleWorld',
  'foreground',
] as const

export type MajorGroup = (typeof MAJOR_GROUPS)[number]
