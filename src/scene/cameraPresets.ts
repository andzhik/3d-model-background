import { useEffect, useState } from 'react'

export type CameraPresetName =
  'desktop-landscape' | 'tablet-portrait' | 'mobile-portrait'

export interface CameraDetailRules {
  rockField: boolean
  framingRocks: boolean
  nearForest: boolean
  foregroundPlants: boolean
}

export interface CameraPreset {
  name: CameraPresetName
  position: readonly [number, number, number]
  fov: number
  sunPosition: readonly [number, number, number]
  details: CameraDetailRules
}

export interface ViewportSize {
  width: number
  height: number
}

export const CAMERA_BREAKPOINTS = {
  mobilePortraitMaxWidth: 640,
} as const

export const CAMERA_TRANSITION = {
  damping: 6,
} as const

/**
 * Presets are measured at 1440x900, 768x1024, and 360x800. The progressively
 * higher Y and Z positions keep the complete lemur low in the frame while the
 * increasing FOV restores horizontal context in portrait viewports.
 */
export const CAMERA_PRESETS: Record<CameraPresetName, CameraPreset> = {
  'desktop-landscape': {
    name: 'desktop-landscape',
    position: [0, 0.8, 8],
    fov: 44,
    sunPosition: [-3, 0.5, -12],
    details: {
      rockField: true,
      framingRocks: true,
      nearForest: true,
      foregroundPlants: true,
    },
  },
  'tablet-portrait': {
    name: 'tablet-portrait',
    position: [0, 0.5, 6.8],
    fov: 46,
    sunPosition: [-2.4, 0.5, -12],
    details: {
      rockField: true,
      framingRocks: false,
      nearForest: true,
      foregroundPlants: true,
    },
  },
  'mobile-portrait': {
    name: 'mobile-portrait',
    position: [0, 1, 9.7],
    fov: 49,
    sunPosition: [-1.8, 0.5, -12],
    details: {
      rockField: false,
      framingRocks: false,
      nearForest: false,
      foregroundPlants: false,
    },
  },
}

export function selectCameraPresetName({
  width,
  height,
}: ViewportSize): CameraPresetName {
  if (width <= 0 || height <= 0 || !Number.isFinite(width + height)) {
    return 'desktop-landscape'
  }

  if (height > width) {
    return width <= CAMERA_BREAKPOINTS.mobilePortraitMaxWidth
      ? 'mobile-portrait'
      : 'tablet-portrait'
  }

  return 'desktop-landscape'
}

export function getCameraPreset(size: ViewportSize): CameraPreset {
  return CAMERA_PRESETS[selectCameraPresetName(size)]
}

function getWindowSize(): ViewportSize {
  if (typeof window === 'undefined') return { width: 1440, height: 900 }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function useResponsiveCameraPreset(): CameraPreset {
  const [preset, setPreset] = useState(() => getCameraPreset(getWindowSize()))

  useEffect(() => {
    const update = () => setPreset(getCameraPreset(getWindowSize()))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return preset
}
