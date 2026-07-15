import { readFile } from 'node:fs/promises'

const GLB_MAGIC = 0x46546c67
const JSON_CHUNK = 0x4e4f534a

export async function readGlbJson(path) {
  const file = await readFile(path)
  if (file.length < 20 || file.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error(`${path} is not a valid GLB file`)
  }
  if (file.readUInt32LE(8) !== file.length) {
    throw new Error(`${path} has an invalid declared length`)
  }

  const chunkLength = file.readUInt32LE(12)
  const chunkType = file.readUInt32LE(16)
  if (
    chunkType !== JSON_CHUNK ||
    chunkLength === 0 ||
    20 + chunkLength > file.length
  ) {
    throw new Error(`${path} does not contain a valid JSON chunk`)
  }

  return {
    byteLength: file.length,
    document: JSON.parse(
      file
        .subarray(20, 20 + chunkLength)
        .toString('utf8')
        .trim(),
    ),
  }
}
