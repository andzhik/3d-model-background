import { describe, expect, it } from 'vitest'

import { WATER_CONFIG } from './constants'
import {
  getWaterAnimationTime,
  REFLECTION_FRAGMENT_SHADER,
  WATER_VERTEX_SHADER,
} from './waterShader'

describe('lake animation and reflection', () => {
  it('advances shader time by the named water speed', () => {
    expect(getWaterAnimationTime(10, false)).toBeCloseTo(
      10 * WATER_CONFIG.speed,
    )
  })

  it('freezes shader time for reduced motion', () => {
    expect(getWaterAnimationTime(10, true)).toBe(0)
  })

  it('uses bounded named water controls and a shader-only reflection mask', () => {
    expect(WATER_CONFIG.speed).toBeGreaterThan(0)
    expect(WATER_CONFIG.amplitude).toBeGreaterThan(0)
    expect(WATER_CONFIG.amplitude).toBeLessThan(0.1)
    expect(WATER_CONFIG.reflectionWidth).toBeGreaterThan(0)
    expect(WATER_VERTEX_SHADER).toContain('uAmplitude')
    expect(REFLECTION_FRAGMENT_SHADER).toContain('brokenMask')
    expect(REFLECTION_FRAGMENT_SHADER).not.toContain('sampler2D')
  })
})
