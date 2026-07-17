import {
  Mesh,
  MeshStandardMaterial,
  type Material,
  type MeshStandardMaterialParameters,
  type Object3D,
} from 'three'

import { MODEL_MATERIAL_PALETTE, type ModelMaterialName } from './palette'

export function lowPolyMaterialParameters(
  color: string,
  overrides: MeshStandardMaterialParameters = {},
): MeshStandardMaterialParameters {
  return {
    color,
    flatShading: true,
    metalness: 0,
    roughness: 0.78,
    ...overrides,
  }
}

export function createLowPolyMaterial(
  color: string,
  overrides: MeshStandardMaterialParameters = {},
): MeshStandardMaterial {
  return new MeshStandardMaterial(lowPolyMaterialParameters(color, overrides))
}

function recolorMaterial(material: Material): Material {
  const clone = material.clone()
  const color = MODEL_MATERIAL_PALETTE[material.name as ModelMaterialName]

  if (color && clone instanceof MeshStandardMaterial) {
    clone.color.set(color)
    clone.flatShading = true
    clone.metalness = 0
    clone.roughness = 0.9
    clone.needsUpdate = true
  }

  return clone
}

/** Clone an authored object and replace every named material with its palette role. */
export function cloneWithScenePalette(source: Object3D): Object3D {
  const clone = source.clone(true)
  clone.traverse((child) => {
    if (!(child instanceof Mesh)) return
    child.material = Array.isArray(child.material)
      ? child.material.map(recolorMaterial)
      : recolorMaterial(child.material)
  })
  return clone
}
