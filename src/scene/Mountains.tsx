import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import type { Object3D } from 'three'

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
  return node.clone()
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
      <group name="MountainParallaxFar">
        <primitive object={layers.far} />
      </group>
      <group name="MountainParallaxLeft">
        <primitive object={layers.left} />
      </group>
      <group name="MountainParallaxRight">
        <primitive object={layers.right} />
      </group>
    </group>
  )
}

useGLTF.preload(MOUNTAIN_MODEL_URL)
