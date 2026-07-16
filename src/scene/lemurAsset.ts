import type { AnimationClip, Object3D } from 'three'

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

export const LEMUR_CLIP_NAMES = [
  'Breathing',
  'Blink',
  'EarTwitch',
  'TailIdle',
] as const

export type LemurClipName = (typeof LEMUR_CLIP_NAMES)[number]
export type LemurClips = Record<LemurClipName, AnimationClip>

export function validateLemurNodes(
  nodes: Record<string, Object3D>,
): LemurNodes {
  for (const name of LEMUR_NODE_NAMES) {
    if (!nodes[name]) throw new Error(`Lemur asset is missing node ${name}`)
  }
  return nodes as LemurNodes
}

export function validateLemurAnimations(
  animations: AnimationClip[],
): LemurClips {
  const clips = Object.fromEntries(animations.map((clip) => [clip.name, clip]))
  for (const name of LEMUR_CLIP_NAMES) {
    if (!clips[name])
      throw new Error(`Lemur asset is missing animation ${name}`)
  }
  return clips as LemurClips
}
