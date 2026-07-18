import { act, renderHook } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSceneVisibility } from './useSceneVisibility'

type ObserverCallback = ConstructorParameters<typeof IntersectionObserver>[0]

class MockIntersectionObserver {
  static callback: ObserverCallback | null = null

  constructor(callback: ObserverCallback) {
    MockIntersectionObserver.callback = callback
  }

  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return []
  }
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds = [0]
}

afterEach(() => {
  vi.restoreAllMocks()
  MockIntersectionObserver.callback = null
})

describe('useSceneVisibility', () => {
  it('stops work while the observed hero is off-screen', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    const element = document.createElement('div')
    const reference = createRef<Element>()
    reference.current = element
    const { result } = renderHook(() => useSceneVisibility(reference))

    expect(result.current).toBe(true)
    act(() => {
      MockIntersectionObserver.callback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })
    expect(result.current).toBe(false)

    act(() => {
      MockIntersectionObserver.callback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })
    expect(result.current).toBe(true)
  })

  it('stops work while the page is hidden and resumes when visible', () => {
    let visibility: DocumentVisibilityState = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility,
    )
    const reference = createRef<Element>()
    const { result } = renderHook(() => useSceneVisibility(reference))

    act(() => {
      visibility = 'hidden'
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current).toBe(false)

    act(() => {
      visibility = 'visible'
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current).toBe(true)
  })
})
