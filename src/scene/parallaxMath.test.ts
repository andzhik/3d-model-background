import { describe, expect, it } from 'vitest'

import { PARALLAX_CONFIG } from './constants'
import {
  damp,
  getCameraPose,
  getHeroScrollProgress,
  normalizePointer,
} from './parallaxMath'

const bounds = { left: 100, top: 50, width: 400, height: 200 }

describe('parallax input bounds', () => {
  it('normalizes viewport corners and returns neutral outside the hero', () => {
    expect(normalizePointer(100, 50, bounds)).toEqual({ x: -1, y: 1 })
    expect(normalizePointer(500, 250, bounds)).toEqual({ x: 1, y: -1 })
    expect(normalizePointer(-10_000, 10_000, bounds)).toEqual({ x: 0, y: 0 })
  })

  it('clamps scroll before and after the hero exit', () => {
    expect(getHeroScrollProgress({ ...bounds, top: 40 })).toBe(0)
    expect(getHeroScrollProgress({ ...bounds, top: -100 })).toBe(0.5)
    expect(getHeroScrollProgress({ ...bounds, top: -500 })).toBe(1)
  })

  it('keeps camera rotation and scroll travel within configured limits', () => {
    const pose = getCameraPose([0, 0, 5], { x: 100, y: -100 }, 0)
    const yaw = Math.atan2(
      pose.target[0] - pose.position[0],
      pose.position[2] - pose.target[2],
    )
    const pitch = Math.atan2(
      pose.target[1] - pose.position[1],
      pose.position[2] - pose.target[2],
    )
    const scrolledPose = getCameraPose([0, 0, 5], { x: 0, y: 0 }, 100)

    expect(Math.abs(yaw) * (180 / Math.PI)).toBeCloseTo(
      PARALLAX_CONFIG.maximumYawDegrees,
    )
    expect(Math.abs(pitch) * (180 / Math.PI)).toBeCloseTo(
      PARALLAX_CONFIG.maximumPitchDegrees,
    )
    expect(scrolledPose.position[2]).toBe(5 - PARALLAX_CONFIG.scrollForward)
    expect(scrolledPose.target[1] - scrolledPose.position[1]).toBe(
      PARALLAX_CONFIG.scrollTargetRaise,
    )
  })

  it('damps toward neutral without overshooting', () => {
    const eased = damp(1, 0, PARALLAX_CONFIG.damping, 1 / 60)
    expect(eased).toBeGreaterThan(0)
    expect(eased).toBeLessThan(1)
  })
})
