import { describe, expect, it } from 'vitest'

import { FOREGROUND_CONFIG } from './constants'
import { createRockFieldLayout } from './rockLayout'

describe('foreground rock layout', () => {
  it('is deterministic and has the configured density', () => {
    const first = createRockFieldLayout()
    const second = createRockFieldLayout()

    expect(first).toEqual(second)
    expect(first).toHaveLength(FOREGROUND_CONFIG.rockCountPerSide * 2)
  })

  it('protects the future lemur corridor and camera clearance', () => {
    for (const rock of createRockFieldLayout()) {
      expect(Math.abs(rock.position[0])).toBeGreaterThan(
        FOREGROUND_CONFIG.protectedHalfWidth,
      )
      expect(rock.position[2]).toBeLessThan(FOREGROUND_CONFIG.cameraClearanceZ)
    }
  })

  it('places rocks on both framing sides', () => {
    const layout = createRockFieldLayout()
    expect(layout.some((rock) => rock.position[0] < 0)).toBe(true)
    expect(layout.some((rock) => rock.position[0] > 0)).toBe(true)
  })
})
