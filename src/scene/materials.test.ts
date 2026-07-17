import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three'
import { describe, expect, it } from 'vitest'

import { cloneWithScenePalette } from './materials'
import { SCENE_PALETTE } from './palette'

describe('scene palette material cloning', () => {
  it('recolors named authored materials without mutating the cached source', () => {
    const sourceMaterial = new MeshStandardMaterial({ color: '#ff00ff' })
    sourceMaterial.name = 'MountainFarBlue'
    const source = new Mesh(new BoxGeometry(), sourceMaterial)

    const clone = cloneWithScenePalette(source) as Mesh
    const cloneMaterial = clone.material as MeshStandardMaterial

    expect(clone).not.toBe(source)
    expect(cloneMaterial).not.toBe(sourceMaterial)
    expect(`#${cloneMaterial.color.getHexString()}`).toBe(
      SCENE_PALETTE.mountainFar,
    )
    expect(`#${sourceMaterial.color.getHexString()}`).toBe('#ff00ff')
  })
})
