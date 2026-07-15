import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { execFileSync } from 'node:child_process'

const windowsCandidates = [
  'D:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe',
  'C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe',
]

async function isExecutable(path) {
  try {
    await access(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

export async function resolveBlender() {
  if (process.env.BLENDER_PATH) {
    if (!(await isExecutable(process.env.BLENDER_PATH))) {
      throw new Error(
        `BLENDER_PATH is not an executable file: ${process.env.BLENDER_PATH}`,
      )
    }
    return process.env.BLENDER_PATH
  }

  for (const candidate of process.platform === 'win32'
    ? windowsCandidates
    : []) {
    if (await isExecutable(candidate)) return candidate
  }

  const lookup = process.platform === 'win32' ? 'where.exe' : 'which'
  try {
    return execFileSync(lookup, ['blender'], { encoding: 'utf8' })
      .trim()
      .split(/\r?\n/)[0]
  } catch {
    throw new Error(
      'Blender was not found. Set BLENDER_PATH to the Blender executable.',
    )
  }
}

if (
  process.argv[1] &&
  import.meta.url ===
    new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href
) {
  process.stdout.write(`${await resolveBlender()}\n`)
}
