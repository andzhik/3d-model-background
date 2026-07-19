import { readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

import { resolveBlender } from './resolve-blender.mjs'

const blender = await resolveBlender()
const manifest = JSON.parse(
  await readFile(resolve('blender/assets-manifest.json'), 'utf8'),
)
const saveBlend = process.argv.includes('--save-blend')

function requestedAssetIds() {
  const ids = []
  for (let index = 2; index < process.argv.length; index += 1) {
    const argument = process.argv[index]
    if (argument === '--asset') {
      const id = process.argv[index + 1]
      if (!id || id.startsWith('--'))
        throw new Error('--asset requires an asset id')
      ids.push(id)
      index += 1
    } else if (argument.startsWith('--asset=')) {
      ids.push(argument.slice('--asset='.length))
    } else if (argument !== '--save-blend') {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }
  return [...new Set(ids)]
}

const selectedIds = requestedAssetIds()
const selectedAssets = selectedIds.length
  ? manifest.assets.filter((asset) => selectedIds.includes(asset.id))
  : manifest.assets

const missingIds = selectedIds.filter(
  (id) => !manifest.assets.some((asset) => asset.id === id),
)
if (missingIds.length > 0)
  throw new Error(`Unknown asset id(s): ${missingIds.join(', ')}`)

async function fileDigest(path) {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex')
}

function generate(asset, output, blendOutput, skipPreviews = false) {
  const generatorArguments = [
    '--background',
    '--factory-startup',
    '--python',
    resolve(asset.generator),
    '--',
    '--output',
    resolve(output),
  ]
  if (blendOutput)
    generatorArguments.push('--blend-output', resolve(blendOutput))
  if (asset.previewDir)
    generatorArguments.push('--preview-dir', resolve(asset.previewDir))
  if (skipPreviews) generatorArguments.push('--skip-previews')

  const generation = spawnSync(blender, generatorArguments, {
    stdio: 'inherit',
  })
  if (generation.status !== 0) process.exit(generation.status ?? 1)
}

const protectedAssets = selectedIds.length
  ? manifest.assets.filter((asset) => !selectedIds.includes(asset.id))
  : []
const protectedDigests = new Map()
for (const asset of protectedAssets) {
  try {
    protectedDigests.set(asset.output, await fileDigest(resolve(asset.output)))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    protectedDigests.set(asset.output, null)
  }
}

for (const asset of selectedAssets) {
  process.stdout.write(`Generating ${asset.id} with ${blender}\n`)
  generate(asset, asset.output, saveBlend ? asset.blendOutput : undefined)

  const validation = spawnSync(
    process.execPath,
    [resolve('scripts/validate-glb.mjs'), asset.id],
    {
      stdio: 'inherit',
    },
  )
  if (validation.status !== 0) process.exit(validation.status ?? 1)

  if (asset.deterministicRepeat) {
    const repeatOutput = `${asset.output}.determinism.glb`
    try {
      generate(asset, repeatOutput, undefined, Boolean(asset.previewDir))
      const [firstDigest, repeatDigest] = await Promise.all([
        fileDigest(resolve(asset.output)),
        fileDigest(resolve(repeatOutput)),
      ])
      if (firstDigest !== repeatDigest)
        throw new Error(
          `${asset.id} did not produce a deterministic repeat build`,
        )
      process.stdout.write(`Deterministic repeat matched ${firstDigest}\n`)
    } finally {
      await rm(resolve(repeatOutput), { force: true })
    }
  }
}

for (const [output, beforeDigest] of protectedDigests) {
  let afterDigest = null
  try {
    afterDigest = await fileDigest(resolve(output))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  if (afterDigest !== beforeDigest)
    throw new Error(`Scoped build unexpectedly changed ${output}`)
}
if (protectedDigests.size > 0)
  process.stdout.write(
    `Scoped build left ${protectedDigests.size} unselected output(s) unchanged\n`,
  )
