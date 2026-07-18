import { useCallback, useMemo, useRef, useState } from 'react'

import {
  getForcedQualityTier,
  recommendRuntimeQuality,
  selectInitialQualityTier,
  type CapabilitySnapshot,
  type SceneQuality,
} from '../scene/quality'

interface NavigatorWithCapabilityHints extends Navigator {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

function hasWebGLApi() {
  return (
    typeof window !== 'undefined' &&
    ('WebGLRenderingContext' in window || 'WebGL2RenderingContext' in window)
  )
}

export function readCapabilitySnapshot(): CapabilitySnapshot {
  if (typeof navigator === 'undefined') {
    return { webgl: false, saveData: false }
  }
  const capabilityNavigator = navigator as NavigatorWithCapabilityHints
  return {
    webgl: hasWebGLApi(),
    saveData: capabilityNavigator.connection?.saveData === true,
    hardwareConcurrency:
      capabilityNavigator.hardwareConcurrency > 0
        ? capabilityNavigator.hardwareConcurrency
        : undefined,
    deviceMemory:
      capabilityNavigator.deviceMemory !== undefined &&
      capabilityNavigator.deviceMemory > 0
        ? capabilityNavigator.deviceMemory
        : undefined,
  }
}

export interface QualityTierController {
  quality: SceneQuality
  forcedQuality: SceneQuality | null
  setDevelopmentOverride: (quality: SceneQuality) => void
  reportRuntimeFps: (averageFps: number) => void
}

export function useQualityTier(): QualityTierController {
  const forcedQuality = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : getForcedQualityTier(window.location.search),
    [],
  )
  const [automaticQuality, setAutomaticQuality] = useState<SceneQuality>(() =>
    selectInitialQualityTier(readCapabilitySnapshot()),
  )
  const [developmentOverride, setDevelopmentOverride] =
    useState<SceneQuality | null>(null)
  const lastChangeAt = useRef(Number.NEGATIVE_INFINITY)
  const quality = forcedQuality ?? developmentOverride ?? automaticQuality

  const reportRuntimeFps = useCallback(
    (averageFps: number) => {
      if (forcedQuality || developmentOverride) return
      const now = performance.now()
      if (now - lastChangeAt.current < 8_000) return
      setAutomaticQuality((current) => {
        if (current === 'poster-only') return current
        const next = recommendRuntimeQuality(current, averageFps)
        if (next !== current) lastChangeAt.current = now
        return next
      })
    },
    [developmentOverride, forcedQuality],
  )

  return {
    quality,
    forcedQuality,
    setDevelopmentOverride,
    reportRuntimeFps,
  }
}
