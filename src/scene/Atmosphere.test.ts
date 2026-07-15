import { describe, expect, it } from 'vitest'

import { createCloudPlacements, getCloudXAtTime } from './cloudLayout'
import { ATMOSPHERE_CONFIG } from './constants'

describe('procedural cloud atmosphere', () => {
  it.each(['far', 'near'] as const)(
    'creates a repeatable %s cloud layer within configured bounds',
    (layerName) => {
      const config = ATMOSPHERE_CONFIG.clouds[layerName]
      const first = createCloudPlacements(layerName)
      const second = createCloudPlacements(layerName)

      expect(first).toEqual(second)
      expect(first).toHaveLength(config.count)
      first.forEach(({ x, y, scale, variant }) => {
        expect(x).toBeGreaterThanOrEqual(config.xRange[0])
        expect(x).toBeLessThanOrEqual(config.xRange[1])
        expect(y).toBeGreaterThanOrEqual(config.yRange[0])
        expect(y).toBeLessThanOrEqual(config.yRange[1])
        expect(scale).toBeGreaterThanOrEqual(config.scaleRange[0])
        expect(scale).toBeLessThanOrEqual(config.scaleRange[1])
        expect(variant).toBeGreaterThanOrEqual(0)
        expect(variant).toBeLessThanOrEqual(2)
      })
    },
  )

  it('computes drift from elapsed time and wraps into the configured field', () => {
    const speed = ATMOSPHERE_CONFIG.clouds.near.speed
    const afterTenSeconds = getCloudXAtTime(2, 10, speed)
    const afterTwentySeconds = getCloudXAtTime(2, 20, speed)

    expect(afterTenSeconds).toBeCloseTo(2 + 10 * speed)
    expect(afterTwentySeconds - afterTenSeconds).toBeCloseTo(10 * speed)
    expect(getCloudXAtTime(15.99, 100, speed)).toBeGreaterThanOrEqual(
      ATMOSPHERE_CONFIG.clouds.wrapMinimum,
    )
    expect(getCloudXAtTime(15.99, 100, speed)).toBeLessThan(
      ATMOSPHERE_CONFIG.clouds.wrapMaximum,
    )
  })

  it('gives near clouds a faster parallax drift than far clouds', () => {
    expect(ATMOSPHERE_CONFIG.clouds.near.z).toBeGreaterThan(
      ATMOSPHERE_CONFIG.clouds.far.z,
    )
    expect(ATMOSPHERE_CONFIG.clouds.near.speed).toBeGreaterThan(
      ATMOSPHERE_CONFIG.clouds.far.speed,
    )
  })
})
