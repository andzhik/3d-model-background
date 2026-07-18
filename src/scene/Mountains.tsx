import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import type { Object3D } from 'three'

import { PARALLAX_CONFIG } from './constants'
import { cloneWithScenePalette } from './materials'
import { ParallaxGroup } from './ParallaxRig'

export const MOUNTAIN_MODEL_URL = '/models/environment-mountains.glb'

const MOUNTAIN_NODE_NAMES = {
  far: 'MountainLayerFar',
  left: 'MountainLayerLeft',
  right: 'MountainLayerRight',
} as const

type MountainLayerName = keyof typeof MOUNTAIN_NODE_NAMES

function getMountainNode(
  nodes: Record<string, Object3D>,
  layer: MountainLayerName,
): Object3D {
  const nodeName = MOUNTAIN_NODE_NAMES[layer]
  const node = nodes[nodeName]
  if (!node) throw new Error(`Mountain asset is missing ${nodeName}`)
  return cloneWithScenePalette(node)
}

interface MountainsProps {
  visible: boolean
}

export function Mountains({ visible }: MountainsProps) {
  const { nodes } = useGLTF(MOUNTAIN_MODEL_URL)
  const layers = useMemo(
    () => ({
      far: getMountainNode(nodes, 'far'),
      left: getMountainNode(nodes, 'left'),
      right: getMountainNode(nodes, 'right'),
    }),
    [nodes],
  )

  return (
    <group name="MountainLayers" visible={visible} dispose={null}>
      <ParallaxGroup
        name="MountainParallaxFar"
        multiplier={PARALLAX_CONFIG.multipliers.mountainsFar}
      >
        <primitive object={layers.far} />
      </ParallaxGroup>
      <ParallaxGroup
        name="MountainParallaxLeft"
        multiplier={PARALLAX_CONFIG.multipliers.mountainsNear}
      >
        <primitive object={layers.left} />
      </ParallaxGroup>
      <ParallaxGroup
        name="MountainParallaxRight"
        multiplier={PARALLAX_CONFIG.multipliers.mountainsNear}
      >
        <primitive object={layers.right} />
      </ParallaxGroup>
    </group>
  )
}
