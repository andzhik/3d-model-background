import { AnimationClip, Object3D } from 'three'
import { describe, expect, it } from 'vitest'

import {
  LEMUR_CLIP_NAMES,
  LEMUR_NODE_NAMES,
  validateLemurAnimations,
  validateLemurNodes,
} from './lemurAsset'

function completeNodeMap() {
  return Object.fromEntries(
    LEMUR_NODE_NAMES.map((name) => [name, new Object3D()]),
  )
}

describe('lemur asset contract', () => {
  it('accepts the complete animation-ready hierarchy', () => {
    const nodes = completeNodeMap()

    expect(validateLemurNodes(nodes).TailRoot).toBe(nodes.TailRoot)
  })

  it('reports the first missing required node', () => {
    const nodes = completeNodeMap()
    delete nodes.HandRight

    expect(() => validateLemurNodes(nodes)).toThrow(
      'Lemur asset is missing node HandRight',
    )
  })
})

describe('lemur animation contract', () => {
  it('accepts all named clips', () => {
    const clips = LEMUR_CLIP_NAMES.map((name) => new AnimationClip(name))

    expect(validateLemurAnimations(clips).TailIdle.name).toBe('TailIdle')
  })

  it('reports a missing clip before the mixer starts', () => {
    const clips = LEMUR_CLIP_NAMES.filter((name) => name !== 'Blink').map(
      (name) => new AnimationClip(name),
    )

    expect(() => validateLemurAnimations(clips)).toThrow(
      'Lemur asset is missing animation Blink',
    )
  })
})
