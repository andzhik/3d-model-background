import {
  CAMERA_CONFIG,
  FOG_CONFIG,
  LIGHT_CONFIG,
  MAJOR_GROUPS,
  type MajorGroup,
} from './constants'

export interface SceneDebugSettings {
  cameraPosition: [number, number, number]
  fov: number
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
    cameraPosition: [...CAMERA_CONFIG.position],
    fov: CAMERA_CONFIG.fov,
    fogNear: FOG_CONFIG.near,
    fogFar: FOG_CONFIG.far,
    lightIntensity: LIGHT_CONFIG.keyIntensity,
    visibility: Object.fromEntries(
      MAJOR_GROUPS.map((group) => [group, true]),
    ) as Record<MajorGroup, boolean>,
  }
}
