import { describe, expect, it } from 'vitest'

import { createSeededRandom } from './random'

describe('createSeededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = createSeededRandom(2026)
    const second = createSeededRandom(2026)

    expect(Array.from({ length: 8 }, first.next)).toEqual(
      Array.from({ length: 8 }, second.next),
    )
  })

  it('keeps decimal values inside the requested half-open range', () => {
    const random = createSeededRandom(14)
    const values = Array.from({ length: 100 }, () => random.range(-3.5, 8.25))

    expect(values.every((value) => value >= -3.5 && value < 8.25)).toBe(true)
  })

  it('keeps integers inside the requested inclusive range', () => {
    const random = createSeededRandom(14)
    const values = Array.from({ length: 100 }, () => random.integer(2, 6))

    expect(values.every((value) => Number.isInteger(value))).toBe(true)
    expect(values.every((value) => value >= 2 && value <= 6)).toBe(true)
  })
})
