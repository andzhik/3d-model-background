import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BLINK_INTERVAL_MS,
  LemurOneShotScheduler,
  REDUCED_BLINK_INTERVAL_MS,
} from './lemurAnimation'

afterEach(() => vi.useRealTimers())

describe('LemurOneShotScheduler', () => {
  it.each([
    [0, BLINK_INTERVAL_MS.minimum],
    [1, BLINK_INTERVAL_MS.maximum],
  ])('keeps blink delay in bounds for random value %s', (random, delay) => {
    vi.useFakeTimers()
    const blink = vi.fn()
    const scheduler = new LemurOneShotScheduler(
      blink,
      vi.fn(),
      false,
      () => random,
    )

    scheduler.start()
    vi.advanceTimersByTime(delay - 1)
    expect(blink).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(blink).toHaveBeenCalledOnce()
    scheduler.stop()
  })

  it('uses sparse blinks and omits ear twitches in reduced motion', () => {
    vi.useFakeTimers()
    const blink = vi.fn()
    const ear = vi.fn()
    const scheduler = new LemurOneShotScheduler(blink, ear, true, () => 0)

    scheduler.start()
    vi.advanceTimersByTime(REDUCED_BLINK_INTERVAL_MS.minimum)
    expect(blink).toHaveBeenCalledOnce()
    expect(ear).not.toHaveBeenCalled()
    scheduler.stop()
  })

  it('clears every pending timer and cannot reschedule after cleanup', () => {
    vi.useFakeTimers()
    const blink = vi.fn()
    const ear = vi.fn()
    const scheduler = new LemurOneShotScheduler(blink, ear, false, () => 0)

    scheduler.start()
    expect(vi.getTimerCount()).toBe(2)
    scheduler.stop()
    expect(vi.getTimerCount()).toBe(0)
    vi.runAllTimers()
    expect(blink).not.toHaveBeenCalled()
    expect(ear).not.toHaveBeenCalled()
  })
})
