import { describe, expect, it } from 'vitest'

import { sceneStatusReducer, type SceneStatus } from './sceneStatus'

describe('sceneStatusReducer', () => {
  it('reveals the canvas only after its first valid frame', () => {
    expect(sceneStatusReducer('loading', { type: 'first-frame' })).toBe('ready')
  })

  it.each<SceneStatus>(['loading', 'ready', 'fallback'])(
    'uses the poster fallback after a failure from %s',
    (status) => {
      expect(sceneStatusReducer(status, { type: 'failure' })).toBe('fallback')
    },
  )

  it('does not revive a failed scene after a late frame callback', () => {
    expect(sceneStatusReducer('fallback', { type: 'first-frame' })).toBe(
      'fallback',
    )
  })
})
