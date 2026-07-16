import { SCENE_SEED, VEGETATION_CONFIG } from './constants'
import type { SceneQuality } from './quality'
import { SCENE_QUALITY } from './quality'
import { createSeededRandom } from './random'

export const PINE_VARIANTS = ['spire', 'compact', 'asymmetric'] as const
export const FOREST_BANDS = ['far', 'near'] as const

export type PineVariant = (typeof PINE_VARIANTS)[number]
export type ForestBand = (typeof FOREST_BANDS)[number]

export interface TreePlacement {
  band: ForestBand
  variant: PineVariant
  position: readonly [number, number, number]
  rotationY: number
  scale: number
}

export interface PlantPlacement {
  position: readonly [number, number, number]
  rotationY: number
  scale: number
}

export interface VegetationLayout {
  trees: TreePlacement[]
  plants: PlantPlacement[]
}

export interface VegetationMetrics {
  treeInstances: number
  plantInstances: number
  totalInstances: number
  expectedDrawCalls: number
}

function createTreeBand(
  quality: SceneQuality,
  band: ForestBand,
): TreePlacement[] {
  const config = VEGETATION_CONFIG[band]
  const count =
    band === 'far'
      ? SCENE_QUALITY[quality].vegetation.farTrees
      : SCENE_QUALITY[quality].vegetation.nearTrees
  const random = createSeededRandom(
    SCENE_SEED +
      VEGETATION_CONFIG.seedOffset +
      (band === 'far' ? 0x131 : 0x529),
  )

  return Array.from({ length: count }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1
    return {
      band,
      variant: PINE_VARIANTS[index % PINE_VARIANTS.length],
      position: [
        side * random.range(config.xRange[0], config.xRange[1]),
        config.y,
        random.range(config.zRange[0], config.zRange[1]),
      ],
      rotationY: random.range(-Math.PI, Math.PI),
      scale: random.range(config.scaleRange[0], config.scaleRange[1]),
    }
  })
}

function createPlants(quality: SceneQuality): PlantPlacement[] {
  const config = VEGETATION_CONFIG.plants
  const count = SCENE_QUALITY[quality].vegetation.plants
  const random = createSeededRandom(
    SCENE_SEED + VEGETATION_CONFIG.seedOffset + 0xa71,
  )

  return Array.from({ length: count }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1
    return {
      position: [
        side * random.range(config.xRange[0], config.xRange[1]),
        config.y,
        random.range(config.zRange[0], config.zRange[1]),
      ],
      rotationY: random.range(-Math.PI, Math.PI),
      scale: random.range(config.scaleRange[0], config.scaleRange[1]),
    }
  })
}

export function createVegetationLayout(
  quality: SceneQuality,
): VegetationLayout {
  return {
    trees: [
      ...createTreeBand(quality, 'far'),
      ...createTreeBand(quality, 'near'),
    ],
    plants: createPlants(quality),
  }
}

export function getVegetationMetrics(quality: SceneQuality): VegetationMetrics {
  const layout = createVegetationLayout(quality)
  const treeBatches = new Set(
    layout.trees.map((tree) => `${tree.band}:${tree.variant}`),
  ).size
  const plantDrawCalls = layout.plants.length > 0 ? 1 : 0

  return {
    treeInstances: layout.trees.length,
    plantInstances: layout.plants.length,
    totalInstances: layout.trees.length + layout.plants.length,
    expectedDrawCalls: treeBatches + plantDrawCalls,
  }
}
