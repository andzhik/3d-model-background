import { describe, expect, it } from 'vitest'

import {
  getForcedQualityTier,
  recommendRuntimeQuality,
  SCENE_QUALITY,
  SCENE_QUALITY_TIERS,
  selectInitialQualityTier,
} from './quality'

describe('quality tier selection', () => {
  it.each(SCENE_QUALITY_TIERS)('supports a forced %s query tier', (tier) => {
    expect(getForcedQualityTier(`?quality=${tier}`)).toBe(tier)
  })

  it('ignores missing and invalid query overrides', () => {
    expect(getForcedQualityTier('')).toBeNull()
    expect(getForcedQualityTier('?quality=ultra')).toBeNull()
  })

  it('uses capability signals without browser identity checks', () => {
    expect(selectInitialQualityTier({ webgl: false, saveData: false })).toBe(
      'poster-only',
    )
    expect(selectInitialQualityTier({ webgl: true, saveData: true })).toBe(
      'poster-only',
    )
    expect(
      selectInitialQualityTier({
        webgl: true,
        saveData: false,
        hardwareConcurrency: 4,
        deviceMemory: 8,
      }),
    ).toBe('low')
    expect(selectInitialQualityTier({ webgl: true, saveData: false })).toBe(
      'medium',
    )
    expect(
      selectInitialQualityTier({
        webgl: true,
        saveData: false,
        hardwareConcurrency: 8,
        deviceMemory: 8,
      }),
    ).toBe('high')
  })

  it('adapts one tier at a time with promotion and demotion hysteresis', () => {
    expect(recommendRuntimeQuality('high', 42)).toBe('medium')
    expect(recommendRuntimeQuality('medium', 30)).toBe('low')
    expect(recommendRuntimeQuality('low', 15)).toBe('poster-only')
    expect(recommendRuntimeQuality('low', 55)).toBe('medium')
    expect(recommendRuntimeQuality('medium', 59)).toBe('high')
    expect(recommendRuntimeQuality('medium', 50)).toBe('medium')
  })

  it('reduces all named costs monotonically across rendered tiers', () => {
    const high = SCENE_QUALITY.high
    const medium = SCENE_QUALITY.medium
    const low = SCENE_QUALITY.low

    expect(high.dpr[1]).toBeGreaterThan(medium.dpr[1])
    expect(medium.dpr[1]).toBeGreaterThan(low.dpr[1])
    expect(high.vegetation.farTrees).toBeGreaterThan(medium.vegetation.farTrees)
    expect(medium.vegetation.farTrees).toBeGreaterThan(low.vegetation.farTrees)
    expect(high.water.lengthSegments).toBeGreaterThan(
      medium.water.lengthSegments,
    )
    expect(medium.water.lengthSegments).toBeGreaterThan(
      low.water.lengthSegments,
    )
    expect(high.shadows).toBe(true)
    expect(medium.shadows).toBe(false)
    expect(low.effects.nearClouds).toBe(false)
    expect(SCENE_QUALITY['poster-only'].vegetation.farTrees).toBe(0)
  })
})
