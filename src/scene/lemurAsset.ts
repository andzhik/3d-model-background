import type { Object3D } from 'three'

export const LEMUR_NODE_NAMES = [
  'Root',
  'Pelvis',
  'Torso',
  'Chest',
  'Neck',
  'Head',
  'FacialMask',
  'EyePatches',
  'EarLeft',
  'EarRight',
  'Muzzle',
  'Eyes',
  'UpperArmLeft',
  'LowerArmLeft',
  'HandLeft',
  'UpperArmRight',
  'LowerArmRight',
  'HandRight',
  'UpperLegLeft',
  'LowerLegLeft',
  'FootLeft',
  'UpperLegRight',
  'LowerLegRight',
  'FootRight',
  'TailRoot',
] as const

export type LemurNodeName = (typeof LEMUR_NODE_NAMES)[number]
export type LemurNodes = Record<LemurNodeName, Object3D>

export function validateLemurNodes(
  nodes: Record<string, Object3D>,
): LemurNodes {
  for (const name of LEMUR_NODE_NAMES) {
    if (!nodes[name]) throw new Error(`Lemur asset is missing node ${name}`)
  }
  return nodes as LemurNodes
}
