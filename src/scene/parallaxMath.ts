import { PARALLAX_CONFIG } from './constants'

export interface NormalizedPoint {
  x: number
  y: number
}

export interface ViewportBounds {
  left: number
  top: number
  width: number
  height: number
}

export interface CameraPose {
  position: readonly [number, number, number]
  target: readonly [number, number, number]
}

export function clampUnit(value: number): number {
  return Math.min(1, Math.max(-1, value))
}

export function normalizePointer(
  clientX: number,
  clientY: number,
  bounds: ViewportBounds,
): NormalizedPoint {
  if (
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    clientX < bounds.left ||
    clientX > bounds.left + bounds.width ||
    clientY < bounds.top ||
    clientY > bounds.top + bounds.height
  ) {
    return { x: 0, y: 0 }
  }

  return {
    x: clampUnit(((clientX - bounds.left) / bounds.width) * 2 - 1),
    y: clampUnit(1 - ((clientY - bounds.top) / bounds.height) * 2),
  }
}

export function getHeroScrollProgress(bounds: ViewportBounds): number {
  if (bounds.height <= 0) return 0
  return Math.min(1, Math.max(0, -bounds.top / bounds.height))
}

export function damp(
  current: number,
  target: number,
  damping: number,
  deltaSeconds: number,
): number {
  const alpha = 1 - Math.exp(-damping * Math.max(0, deltaSeconds))
  return current + (target - current) * alpha
}

export function getCameraPose(
  basePosition: readonly [number, number, number],
  pointer: NormalizedPoint,
  scrollProgress: number,
): CameraPose {
  const boundedPointer = {
    x: clampUnit(pointer.x),
    y: clampUnit(pointer.y),
  }
  const boundedScroll = Math.min(1, Math.max(0, scrollProgress))
  const position: [number, number, number] = [
    basePosition[0] + boundedPointer.x * PARALLAX_CONFIG.cameraTravel[0],
    basePosition[1] + boundedPointer.y * PARALLAX_CONFIG.cameraTravel[1],
    basePosition[2] - boundedScroll * PARALLAX_CONFIG.scrollForward,
  ]
  const yaw =
    boundedPointer.x * PARALLAX_CONFIG.maximumYawDegrees * (Math.PI / 180)
  const pitch =
    boundedPointer.y * PARALLAX_CONFIG.maximumPitchDegrees * (Math.PI / 180)

  return {
    position,
    target: [
      position[0] + Math.tan(yaw) * PARALLAX_CONFIG.lookDistance,
      position[1] +
        Math.tan(pitch) * PARALLAX_CONFIG.lookDistance +
        boundedScroll * PARALLAX_CONFIG.scrollTargetRaise,
      position[2] - PARALLAX_CONFIG.lookDistance,
    ],
  }
}
