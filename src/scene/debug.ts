import {
  FOG_CONFIG,
  LIGHT_CONFIG,
  MAJOR_GROUPS,
  type MajorGroup,
} from './constants'

export interface SceneDebugSettings {
  cameraOffset: [number, number, number]
  fovOffset: number
  fogNear: number
  fogFar: number
  lightIntensity: number
  visibility: Record<MajorGroup, boolean>
}

export interface RendererStatistics {
  drawCalls: number
  triangles: number
}

export function createDefaultDebugSettings(): SceneDebugSettings {
  return {
    cameraOffset: [0, 0, 0],
    fovOffset: 0,
    fogNear: FOG_CONFIG.near,
    fogFar: FOG_CONFIG.far,
    lightIntensity: LIGHT_CONFIG.keyIntensity,
    visibility: Object.fromEntries(
      MAJOR_GROUPS.map((group) => [group, true]),
    ) as Record<MajorGroup, boolean>,
  }
}
