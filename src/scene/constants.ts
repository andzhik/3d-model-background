import { SCENE_PALETTE } from './palette'

export const SCENE_SEED = 0x1e4d_2026

export const CAMERA_CONFIG = {
  position: [0, 0, 5] as const,
  fov: 42,
  near: 0.1,
  far: 100,
} as const

export const PARALLAX_CONFIG = {
  damping: 5,
  maximumYawDegrees: 1.5,
  maximumPitchDegrees: 1.25,
  cameraTravel: [0.06, 0.04] as const,
  lookDistance: 5,
  groupTravel: [0.42, 0.2] as const,
  scrollForward: 0.35,
  scrollTargetRaise: 0.22,
  multipliers: {
    sky: 0,
    cloudsFar: 0.05,
    cloudsNear: 0.1,
    mountainsFar: 0.08,
    mountainsNear: 0.16,
    forest: 0.25,
    lemur: 0.35,
    foreground: 0.5,
  },
} as const

export const FOG_CONFIG = {
  color: SCENE_PALETTE.fog,
  near: 7.5,
  far: 24,
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

export const WATER_CONFIG = {
  position: [0, -1.52, -3.2] as const,
  width: 32,
  length: 18,
  widthSegments: 48,
  lengthSegments: 64,
  speed: 0.22,
  amplitude: 0.055,
  reflectionWidth: 2.8,
  reflectionLift: 0.012,
} as const

export const FOREGROUND_CONFIG = {
  modelUrl: '/models/environment-foreground.glb',
  seedOffset: 0x08_f0,
  protectedHalfWidth: 2.65,
  cameraClearanceZ: 1.5,
  rockCountPerSide: 9,
  framingRocks: {
    left: {
      position: [-5.4, -1.9, 0.9] as const,
      rotation: [0.08, -0.28, -0.06] as const,
      scale: 1.25,
    },
    right: {
      position: [5.3, -1.92, 0.82] as const,
      rotation: [-0.04, 0.36, 0.08] as const,
      scale: 1.22,
    },
  },
} as const

export const LEMUR_CONFIG = {
  modelUrl: '/models/lemur.glb',
  position: [0, -1.35, -0.28] as const,
  rotation: [0, 0, 0] as const,
  scale: 0.9,
} as const

export const VEGETATION_CONFIG = {
  seedOffset: 0x09_f1,
  protectedHalfWidth: 3.05,
  maxTreeRadius: 0.76,
  maxPlantRadius: 0.32,
  far: {
    xRange: [4.15, 10.2] as const,
    zRange: [-10.4, -6.1] as const,
    scaleRange: [0.58, 0.92] as const,
    y: -1.46,
  },
  near: {
    xRange: [4.2, 8.2] as const,
    zRange: [-5.8, -1.75] as const,
    scaleRange: [0.88, 1.38] as const,
    y: -1.58,
  },
  plants: {
    xRange: [3.45, 7.15] as const,
    zRange: [-1.35, 0.65] as const,
    scaleRange: [0.55, 1.08] as const,
    y: -1.72,
  },
} as const

export const MAJOR_GROUPS = [
  'environment',
  'distantWorld',
  'middleWorld',
  'foreground',
] as const

export type MajorGroup = (typeof MAJOR_GROUPS)[number]
