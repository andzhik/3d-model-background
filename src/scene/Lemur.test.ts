import { Object3D } from 'three'
import { describe, expect, it } from 'vitest'

import { LEMUR_NODE_NAMES, validateLemurNodes } from './lemurAsset'

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
