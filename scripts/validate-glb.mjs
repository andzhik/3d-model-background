import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

import { readGlbJson } from './glb-utils.mjs'

const manifestPath = resolve('blender/assets-manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const requestedId = process.argv[2]
const assets = requestedId
  ? manifest.assets.filter((asset) => asset.id === requestedId)
  : manifest.assets

if (assets.length === 0)
  throw new Error(`No asset named ${requestedId} exists in the manifest`)

for (const asset of assets) {
  const output = resolve(asset.output)
  const { byteLength, document } = await readGlbJson(output)
  const minimumSize = asset.minBytes ?? 100
  if (byteLength <= minimumSize)
    throw new Error(
      `${asset.output} is unexpectedly small (${byteLength} bytes)`,
    )
  if (asset.maxBytes !== undefined && byteLength > asset.maxBytes)
    throw new Error(`${asset.output} exceeds ${asset.maxBytes} bytes`)

  const objectNames = new Set((document.nodes ?? []).map((node) => node.name))
  const materialNames = new Set(
    (document.materials ?? []).map((material) => material.name),
  )
  for (const name of asset.expectedObjects) {
    if (!objectNames.has(name))
      throw new Error(`${asset.output} is missing object ${name}`)
  }
  for (const name of asset.expectedMaterials) {
    if (!materialNames.has(name))
      throw new Error(`${asset.output} is missing material ${name}`)
  }

  if (asset.requireFinitePositionBounds) {
    const positionAccessors = (document.meshes ?? []).flatMap((mesh) =>
      (mesh.primitives ?? []).map(
        (primitive) => document.accessors?.[primitive.attributes?.POSITION],
      ),
    )
    if (positionAccessors.length === 0)
      throw new Error(`${asset.output} has no position accessors`)

    for (const accessor of positionAccessors) {
      if (
        !accessor ||
        !Array.isArray(accessor.min) ||
        !Array.isArray(accessor.max)
      )
        throw new Error(
          `${asset.output} has a position accessor without bounds`,
        )
      if (
        accessor.min.length !== accessor.max.length ||
        accessor.min.some((value) => !Number.isFinite(value)) ||
        accessor.max.some((value) => !Number.isFinite(value)) ||
        accessor.min.some((value, index) => value > accessor.max[index])
      )
        throw new Error(`${asset.output} has invalid accessor bounds`)
    }
  }

  process.stdout.write(`Validated ${asset.output} (${byteLength} bytes)\n`)
}
