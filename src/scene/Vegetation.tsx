import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import { SCENE_PALETTE } from './palette'
import { PARALLAX_CONFIG } from './constants'
import { ParallaxGroup } from './ParallaxRig'
import type { SceneQuality } from './quality'
import {
  FOREST_BANDS,
  PINE_VARIANTS,
  createVegetationLayout,
  type ForestBand,
  type PineVariant,
  type PlantPlacement,
  type TreePlacement,
} from './vegetationLayout'

interface PineShape {
  trunkHeight: number
  layers: ReadonlyArray<{
    radius: number
    height: number
    y: number
    sides: number
    x?: number
  }>
}

const PINE_SHAPES: Record<PineVariant, PineShape> = {
  spire: {
    trunkHeight: 0.72,
    layers: [
      { radius: 0.68, height: 1.18, y: 0.94, sides: 6 },
      { radius: 0.52, height: 1.1, y: 1.52, sides: 6 },
      { radius: 0.34, height: 0.94, y: 2.05, sides: 5 },
    ],
  },
  compact: {
    trunkHeight: 0.58,
    layers: [
      { radius: 0.76, height: 0.9, y: 0.78, sides: 7 },
      { radius: 0.57, height: 0.84, y: 1.22, sides: 6 },
      { radius: 0.39, height: 0.75, y: 1.62, sides: 6 },
    ],
  },
  asymmetric: {
    trunkHeight: 0.68,
    layers: [
      { radius: 0.72, height: 1.02, y: 0.86, sides: 5, x: -0.06 },
      { radius: 0.55, height: 0.96, y: 1.36, sides: 6, x: 0.08 },
      { radius: 0.36, height: 0.88, y: 1.83, sides: 5, x: -0.03 },
    ],
  },
}

function colorGeometry(geometry: BufferGeometry, color: string) {
  const position = geometry.getAttribute('position')
  const value = new Color(color)
  const colors = new Float32Array(position.count * 3)
  for (let index = 0; index < position.count; index += 1) {
    value.toArray(colors, index * 3)
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

function createPineGeometry(variant: PineVariant) {
  const shape = PINE_SHAPES[variant]
  const trunk = colorGeometry(
    new CylinderGeometry(0.085, 0.13, shape.trunkHeight, 5).translate(
      0,
      shape.trunkHeight / 2,
      0,
    ),
    SCENE_PALETTE.pineTrunk,
  )
  const layers = shape.layers.map((layer, index) =>
    colorGeometry(
      new CylinderGeometry(
        0,
        layer.radius,
        layer.height,
        layer.sides,
      ).translate(layer.x ?? 0, layer.y, 0),
      index % 2 === 0 ? SCENE_PALETTE.pineNeedleDark : SCENE_PALETTE.pineNeedle,
    ),
  )
  const geometry = mergeGeometries([trunk, ...layers], false)
  if (!geometry) throw new Error(`Could not build pine variant ${variant}`)
  geometry.computeBoundingSphere()
  return geometry
}

function createPlantGeometry() {
  const geometry = new BufferGeometry()
  const positions: number[] = []
  const indices: number[] = []
  const blades = [
    { x: -0.16, height: 0.68, lean: -0.12 },
    { x: 0, height: 0.92, lean: 0.04 },
    { x: 0.17, height: 0.61, lean: 0.14 },
  ]
  blades.forEach((blade, index) => {
    const offset = index * 3
    positions.push(
      blade.x - 0.035,
      0,
      0,
      blade.x + 0.035,
      0,
      0,
      blade.x + blade.lean,
      blade.height,
      0,
    )
    indices.push(offset, offset + 1, offset + 2)
  })
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  )
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

const PINE_GEOMETRIES = Object.fromEntries(
  PINE_VARIANTS.map((variant) => [variant, createPineGeometry(variant)]),
) as Record<PineVariant, BufferGeometry>
const PLANT_GEOMETRY = createPlantGeometry()

function applyInstanceMatrices(
  mesh: InstancedMesh,
  placements: ReadonlyArray<TreePlacement | PlantPlacement>,
) {
  const matrix = new Matrix4()
  const quaternion = new Quaternion()
  const position = new Vector3()
  const scale = new Vector3()
  const rotation = new Euler()

  placements.forEach((placement, index) => {
    position.fromArray(placement.position)
    rotation.set(0, placement.rotationY, 0)
    quaternion.setFromEuler(rotation)
    scale.setScalar(placement.scale)
    matrix.compose(position, quaternion, scale)
    mesh.setMatrixAt(index, matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
}

interface TreeBatchProps {
  band: ForestBand
  variant: PineVariant
  placements: TreePlacement[]
}

function TreeBatch({ band, variant, placements }: TreeBatchProps) {
  const instances = useRef<InstancedMesh>(null)
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color:
          band === 'far' ? SCENE_PALETTE.forestFar : SCENE_PALETTE.forestNear,
        flatShading: true,
        roughness: 0.94,
        vertexColors: true,
      }),
    [band],
  )

  useLayoutEffect(() => {
    if (instances.current) applyInstanceMatrices(instances.current, placements)
  }, [placements])

  return (
    <instancedMesh
      ref={instances}
      name={`Pines-${band}-${variant}`}
      args={[PINE_GEOMETRIES[variant], material, placements.length]}
      frustumCulled={false}
    />
  )
}

function PlantBatch({ placements }: { placements: PlantPlacement[] }) {
  const instances = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (instances.current) applyInstanceMatrices(instances.current, placements)
  }, [placements])

  return (
    <instancedMesh
      ref={instances}
      name="ForegroundReeds"
      args={[PLANT_GEOMETRY, undefined, placements.length]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        color={SCENE_PALETTE.reeds}
        side={DoubleSide}
        flatShading
        roughness={1}
      />
    </instancedMesh>
  )
}

interface VegetationProps {
  quality: SceneQuality
  distantVisible: boolean
  middleVisible: boolean
  foregroundVisible: boolean
}

export function Vegetation({
  quality,
  distantVisible,
  middleVisible,
  foregroundVisible,
}: VegetationProps) {
  const layout = useMemo(() => createVegetationLayout(quality), [quality])

  return (
    <group name="ProceduralVegetation" dispose={null}>
      {FOREST_BANDS.map((band) => (
        <ParallaxGroup
          key={band}
          name={`ForestBand-${band}`}
          visible={band === 'far' ? distantVisible : middleVisible}
          multiplier={
            band === 'far'
              ? PARALLAX_CONFIG.multipliers.mountainsNear
              : PARALLAX_CONFIG.multipliers.forest
          }
        >
          {PINE_VARIANTS.map((variant) => {
            const placements = layout.trees.filter(
              (tree) => tree.band === band && tree.variant === variant,
            )
            return placements.length > 0 ? (
              <TreeBatch
                key={variant}
                band={band}
                variant={variant}
                placements={placements}
              />
            ) : null
          })}
        </ParallaxGroup>
      ))}
      <ParallaxGroup
        name="ForegroundPlants"
        visible={foregroundVisible}
        multiplier={PARALLAX_CONFIG.multipliers.foreground}
      >
        {layout.plants.length > 0 && <PlantBatch placements={layout.plants} />}
      </ParallaxGroup>
    </group>
  )
}
