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

import { FOREGROUND_CONFIG, PARALLAX_CONFIG } from './constants'
import type { CameraDetailRules } from './cameraPresets'
import { cloneWithScenePalette } from './materials'
import { ParallaxGroup } from './ParallaxRig'
import {
  createRockFieldLayout,
  ROCK_VARIANTS,
  type RockPlacement,
  type RockVariant,
} from './rockLayout'

const NODE_NAMES = {
  shoreLeft: 'ShoreLeft',
  shoreRight: 'ShoreRight',
  smallA: 'RockSourceSmallA',
  smallB: 'RockSourceSmallB',
  smallC: 'RockSourceSmallC',
  frameLeft: 'RockSourceFrameLeft',
  frameRight: 'RockSourceFrameRight',
} as const

type ForegroundNodeName = keyof typeof NODE_NAMES

function getMeshObject(
  nodes: Record<string, Object3D>,
  key: ForegroundNodeName,
): Object3D {
  const name = NODE_NAMES[key]
  const node = nodes[name]
  let containsMesh = false
  node?.traverse((child) => {
    if (child instanceof Mesh) containsMesh = true
  })
  if (!node || !containsMesh)
    throw new Error(`Foreground asset is missing mesh ${name}`)
  return cloneWithScenePalette(node)
}

interface RockAssetProps {
  source: Object3D
  name: string
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
  scale: number
}

export function RockAsset({
  source,
  name,
  position,
  rotation,
  scale,
}: RockAssetProps) {
  const rock = useMemo(() => source.clone(true), [source])
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
  source: Object3D
  placements: RockPlacement[]
  variant: RockVariant
}

interface RockPrimitiveInstancesProps extends Omit<
  RockInstancesProps,
  'source'
> {
  mesh: Mesh
  primitiveIndex: number
}

function RockPrimitiveInstances({
  mesh,
  placements,
  variant,
  primitiveIndex,
}: RockPrimitiveInstancesProps) {
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
      name={`RockField-${variant}-${primitiveIndex}`}
      args={[
        mesh.geometry,
        mesh.material as Material | Material[],
        placements.length,
      ]}
      frustumCulled={false}
    />
  )
}

function RockInstances({ source, placements, variant }: RockInstancesProps) {
  const meshes = useMemo(() => {
    const descendants: Mesh[] = []
    source.traverse((child) => {
      if (child instanceof Mesh) descendants.push(child)
    })
    return descendants
  }, [source])

  return (
    <group name={`RockField-${variant}`}>
      {meshes.map((mesh, primitiveIndex) => (
        <RockPrimitiveInstances
          key={mesh.uuid}
          mesh={mesh}
          primitiveIndex={primitiveIndex}
          variant={variant}
          placements={placements}
        />
      ))}
    </group>
  )
}

interface RockFieldProps {
  sources: Record<RockVariant, Object3D>
}

export function RockField({ sources }: RockFieldProps) {
  const placements = useMemo(() => createRockFieldLayout(), [])

  return (
    <group name="SeededRockField">
      {ROCK_VARIANTS.map((variant) => (
        <RockInstances
          key={variant}
          variant={variant}
          source={sources[variant]}
          placements={placements.filter((rock) => rock.variant === variant)}
        />
      ))}
    </group>
  )
}

interface ForegroundProps {
  middleVisible: boolean
  foregroundVisible: boolean
  details: CameraDetailRules
}

export function Foreground({
  middleVisible,
  foregroundVisible,
  details,
}: ForegroundProps) {
  const { nodes } = useGLTF(FOREGROUND_CONFIG.modelUrl)
  const meshes = useMemo(
    () => ({
      shoreLeft: getMeshObject(nodes, 'shoreLeft'),
      shoreRight: getMeshObject(nodes, 'shoreRight'),
      smallA: getMeshObject(nodes, 'smallA'),
      smallB: getMeshObject(nodes, 'smallB'),
      smallC: getMeshObject(nodes, 'smallC'),
      frameLeft: getMeshObject(nodes, 'frameLeft'),
      frameRight: getMeshObject(nodes, 'frameRight'),
    }),
    [nodes],
  )

  const shoreLeft = useMemo(() => meshes.shoreLeft.clone(), [meshes.shoreLeft])
  const shoreRight = useMemo(
    () => meshes.shoreRight.clone(),
    [meshes.shoreRight],
  )
  return (
    <group name="EnvironmentForeground" dispose={null}>
      <ParallaxGroup
        name="ShoreSources"
        visible={middleVisible}
        multiplier={PARALLAX_CONFIG.multipliers.forest}
      >
        <primitive object={shoreLeft} />
        <primitive object={shoreRight} />
      </ParallaxGroup>
      <ParallaxGroup
        name="ForegroundFraming"
        visible={foregroundVisible}
        multiplier={PARALLAX_CONFIG.multipliers.foreground}
      >
        <group name="ResponsiveRockField" visible={details.rockField}>
          <RockField sources={meshes} />
        </group>
        <group name="ResponsiveFramingRocks" visible={details.framingRocks}>
          <RockAsset
            source={meshes.frameLeft}
            name="FramingRockLeft"
            {...FOREGROUND_CONFIG.framingRocks.left}
          />
          <RockAsset
            source={meshes.frameRight}
            name="FramingRockRight"
            {...FOREGROUND_CONFIG.framingRocks.right}
          />
        </group>
      </ParallaxGroup>
    </group>
  )
}

useGLTF.preload(FOREGROUND_CONFIG.modelUrl)
