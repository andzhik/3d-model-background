import {
  MeshStandardMaterial,
  type MeshStandardMaterialParameters,
} from 'three'

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
