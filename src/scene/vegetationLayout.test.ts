import { describe, expect, it } from 'vitest'

import { VEGETATION_CONFIG } from './constants'
import { SCENE_QUALITY, type SceneQuality } from './quality'
import {
  createVegetationLayout,
  getVegetationMetrics,
} from './vegetationLayout'

const RENDERED_TIERS: SceneQuality[] = ['high', 'medium', 'low']

describe('procedural vegetation layout', () => {
  it.each(RENDERED_TIERS)(
    '%s is deterministic and matches configured counts',
    (quality) => {
      const first = createVegetationLayout(quality)
      const second = createVegetationLayout(quality)
      const counts = SCENE_QUALITY[quality].vegetation

      expect(first).toEqual(second)
      expect(first.trees).toHaveLength(counts.farTrees + counts.nearTrees)
      expect(first.plants).toHaveLength(counts.plants)
    },
  )

  it.each(RENDERED_TIERS)(
    '%s keeps the central lake corridor open',
    (quality) => {
      const layout = createVegetationLayout(quality)
      for (const tree of layout.trees) {
        expect(
          Math.abs(tree.position[0]) -
            VEGETATION_CONFIG.maxTreeRadius * tree.scale,
        ).toBeGreaterThanOrEqual(VEGETATION_CONFIG.protectedHalfWidth)
      }
      for (const plant of layout.plants) {
        expect(
          Math.abs(plant.position[0]) -
            VEGETATION_CONFIG.maxPlantRadius * plant.scale,
        ).toBeGreaterThanOrEqual(VEGETATION_CONFIG.protectedHalfWidth)
      }
    },
  )

  it('reduces density substantially at low quality', () => {
    const high = getVegetationMetrics('high')
    const low = getVegetationMetrics('low')

    expect(low.totalInstances).toBeLessThan(high.totalInstances / 2)
    expect(high).toMatchObject({
      treeInstances: 114,
      plantInstances: 54,
      totalInstances: 168,
      expectedDrawCalls: 7,
    })
    expect(low).toMatchObject({
      treeInstances: 38,
      plantInstances: 18,
      totalInstances: 56,
      expectedDrawCalls: 7,
    })
  })

  it('uses no vegetation instances or draw calls in poster-only mode', () => {
    expect(getVegetationMetrics('poster-only')).toEqual({
      treeInstances: 0,
      plantInstances: 0,
      totalInstances: 0,
      expectedDrawCalls: 0,
    })
  })
})
