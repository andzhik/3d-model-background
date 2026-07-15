export interface SeededRandom {
  next: () => number
  range: (minimum: number, maximum: number) => number
  integer: (minimum: number, maximum: number) => number
}

/** Mulberry32 provides a compact, repeatable 32-bit procedural sequence. */
export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0

  const next = () => {
    state = (state + 0x6d2b_79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }

  return {
    next,
    range(minimum, maximum) {
      if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
        throw new RangeError('Random range bounds must be finite')
      }
      if (maximum < minimum) {
        throw new RangeError('Random range maximum must be at least minimum')
      }
      return minimum + next() * (maximum - minimum)
    },
    integer(minimum, maximum) {
      if (!Number.isInteger(minimum) || !Number.isInteger(maximum)) {
        throw new RangeError('Random integer bounds must be integers')
      }
      if (maximum < minimum) {
        throw new RangeError('Random integer maximum must be at least minimum')
      }
      return Math.floor(minimum + next() * (maximum - minimum + 1))
    },
  }
}
