import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import { resolveBlender } from './resolve-blender.mjs'

const blender = await resolveBlender()
const manifest = JSON.parse(
  await readFile(resolve('blender/assets-manifest.json'), 'utf8'),
)
const saveBlend = process.argv.includes('--save-blend')

for (const asset of manifest.assets) {
  const generatorArguments = [
    '--background',
    '--factory-startup',
    '--python',
    resolve(asset.generator),
    '--',
    '--output',
    resolve(asset.output),
  ]
  if (saveBlend)
    generatorArguments.push('--blend-output', resolve(asset.blendOutput))

  process.stdout.write(`Generating ${asset.id} with ${blender}\n`)
  const generation = spawnSync(blender, generatorArguments, {
    stdio: 'inherit',
  })
  if (generation.status !== 0) process.exit(generation.status ?? 1)

  const validation = spawnSync(
    process.execPath,
    [resolve('scripts/validate-glb.mjs'), asset.id],
    {
      stdio: 'inherit',
    },
  )
  if (validation.status !== 0) process.exit(validation.status ?? 1)
}
