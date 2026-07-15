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
  if (byteLength <= 100)
    throw new Error(`${asset.output} is unexpectedly small`)

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

  process.stdout.write(`Validated ${asset.output} (${byteLength} bytes)\n`)
}
