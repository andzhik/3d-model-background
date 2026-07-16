import { useGLTF } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  Euler,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  Vector3,
  type Material,
  type Object3D,
} from 'three'

import { FOREGROUND_CONFIG } from './constants'
import {
  createRockFieldLayout,
  ROCK_VARIANTS,
  type RockPlacement,
  type RockVariant,
} from './rockLayout'

const NODE_NAMES = {
  shoreLeft: 'ShoreLeft',
  shoreRight: 'ShoreRight',
  platform: 'MeditationPlatform',
  smallA: 'RockSourceSmallA',
  smallB: 'RockSourceSmallB',
  smallC: 'RockSourceSmallC',
  frameLeft: 'RockSourceFrameLeft',
  frameRight: 'RockSourceFrameRight',
} as const

type ForegroundNodeName = keyof typeof NODE_NAMES

function getMesh(
  nodes: Record<string, Object3D>,
  key: ForegroundNodeName,
): Mesh {
  const name = NODE_NAMES[key]
  const node = nodes[name]
  if (!(node instanceof Mesh))
    throw new Error(`Foreground asset is missing mesh ${name}`)
  return node
}

interface RockAssetProps {
  mesh: Mesh
  name: string
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
  scale: number
}

export function RockAsset({
  mesh,
  name,
  position,
  rotation,
  scale,
}: RockAssetProps) {
  const rock = useMemo(() => mesh.clone(), [mesh])
  return (
    <primitive
      object={rock}
      name={name}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  )
}

interface RockInstancesProps {
  mesh: Mesh
  placements: RockPlacement[]
  variant: RockVariant
}

function RockInstances({ mesh, placements, variant }: RockInstancesProps) {
  const instances = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!instances.current) return
    const matrix = new Matrix4()
    const quaternion = new Quaternion()
    const position = new Vector3()
    const scale = new Vector3()
    const rotation = new Euler()

    placements.forEach((placement, index) => {
      position.fromArray(placement.position)
      rotation.set(...placement.rotation)
      quaternion.setFromEuler(rotation)
      scale.setScalar(placement.scale)
      matrix.compose(position, quaternion, scale)
      instances.current?.setMatrixAt(index, matrix)
    })
    instances.current.instanceMatrix.needsUpdate = true
  }, [placements])

  return (
    <instancedMesh
      ref={instances}
      name={`RockField-${variant}`}
      args={[
        mesh.geometry,
        mesh.material as Material | Material[],
        placements.length,
      ]}
      frustumCulled={false}
    />
  )
}

interface RockFieldProps {
  sources: Record<RockVariant, Mesh>
}

export function RockField({ sources }: RockFieldProps) {
  const placements = useMemo(() => createRockFieldLayout(), [])

  return (
    <group name="SeededRockField">
      {ROCK_VARIANTS.map((variant) => (
        <RockInstances
          key={variant}
          variant={variant}
          mesh={sources[variant]}
          placements={placements.filter((rock) => rock.variant === variant)}
        />
      ))}
    </group>
  )
}

interface ForegroundProps {
  middleVisible: boolean
  foregroundVisible: boolean
}

export function Foreground({
  middleVisible,
  foregroundVisible,
}: ForegroundProps) {
  const { nodes } = useGLTF(FOREGROUND_CONFIG.modelUrl)
  const meshes = useMemo(
    () => ({
      shoreLeft: getMesh(nodes, 'shoreLeft'),
      shoreRight: getMesh(nodes, 'shoreRight'),
      platform: getMesh(nodes, 'platform'),
      smallA: getMesh(nodes, 'smallA'),
      smallB: getMesh(nodes, 'smallB'),
      smallC: getMesh(nodes, 'smallC'),
      frameLeft: getMesh(nodes, 'frameLeft'),
      frameRight: getMesh(nodes, 'frameRight'),
    }),
    [nodes],
  )

  const shoreLeft = useMemo(() => meshes.shoreLeft.clone(), [meshes.shoreLeft])
  const shoreRight = useMemo(
    () => meshes.shoreRight.clone(),
    [meshes.shoreRight],
  )
  const platform = useMemo(() => meshes.platform.clone(), [meshes.platform])

  return (
    <group name="EnvironmentForeground" dispose={null}>
      <group name="ShoreSources" visible={middleVisible}>
        <primitive object={shoreLeft} />
        <primitive object={shoreRight} />
      </group>
      <group name="ForegroundFraming" visible={foregroundVisible}>
        <primitive object={platform} />
        <RockField sources={meshes} />
        <RockAsset
          mesh={meshes.frameLeft}
          name="FramingRockLeft"
          {...FOREGROUND_CONFIG.framingRocks.left}
        />
        <RockAsset
          mesh={meshes.frameRight}
          name="FramingRockRight"
          {...FOREGROUND_CONFIG.framingRocks.right}
        />
      </group>
    </group>
  )
}

useGLTF.preload(FOREGROUND_CONFIG.modelUrl)
