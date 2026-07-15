import { ATMOSPHERE_CONFIG, SCENE_SEED } from './constants'
import { createSeededRandom } from './random'

export type CloudLayerName = 'far' | 'near'

export interface CloudPlacement {
  x: number
  y: number
  scale: number
  variant: number
}

export function createCloudPlacements(
  layerName: CloudLayerName,
): CloudPlacement[] {
  const config = ATMOSPHERE_CONFIG.clouds[layerName]
  const random = createSeededRandom(SCENE_SEED + config.seedOffset)

  return Array.from({ length: config.count }, () => ({
    x: random.range(config.xRange[0], config.xRange[1]),
    y: random.range(config.yRange[0], config.yRange[1]),
    scale: random.range(config.scaleRange[0], config.scaleRange[1]),
    variant: random.integer(0, 2),
  }))
}

export function getCloudXAtTime(
  initialX: number,
  elapsedSeconds: number,
  speed: number,
): number {
  const { wrapMinimum, wrapMaximum } = ATMOSPHERE_CONFIG.clouds
  const width = wrapMaximum - wrapMinimum
  const translated = initialX + elapsedSeconds * speed - wrapMinimum
  return (((translated % width) + width) % width) + wrapMinimum
}
