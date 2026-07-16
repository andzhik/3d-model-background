import { FOREGROUND_CONFIG, SCENE_SEED } from './constants'
import { createSeededRandom } from './random'

export const ROCK_VARIANTS = ['smallA', 'smallB', 'smallC'] as const

export type RockVariant = (typeof ROCK_VARIANTS)[number]

export interface RockPlacement {
  variant: RockVariant
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
  scale: number
}

function createSidePlacements(side: -1 | 1): RockPlacement[] {
  const random = createSeededRandom(
    SCENE_SEED + FOREGROUND_CONFIG.seedOffset + (side === -1 ? 0 : 0x451),
  )

  return Array.from(
    { length: FOREGROUND_CONFIG.rockCountPerSide },
    (_, index) => {
      const depthRatio = index / (FOREGROUND_CONFIG.rockCountPerSide - 1)
      const edgeDistance = random.range(3.35, 7.4) + depthRatio * 1.2
      const z = random.range(-5.8, 0.45) + depthRatio * 0.5
      return {
        variant: ROCK_VARIANTS[random.integer(0, ROCK_VARIANTS.length - 1)],
        position: [side * edgeDistance, random.range(-1.92, -1.61), z],
        rotation: [
          random.range(-0.14, 0.14),
          random.range(-Math.PI, Math.PI),
          random.range(-0.12, 0.12),
        ],
        scale: random.range(0.42, 0.86),
      }
    },
  )
}

export function createRockFieldLayout(): RockPlacement[] {
  return [...createSidePlacements(-1), ...createSidePlacements(1)]
}
