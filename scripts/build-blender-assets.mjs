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

for (const asset of manifest.assets) {
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
