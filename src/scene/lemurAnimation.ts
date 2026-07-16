import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  type AnimationAction,
  type Object3D,
} from 'three'

import { useReducedMotion } from '../hooks/useReducedMotion'
import type { LemurClips } from './lemurAsset'

export const BLINK_INTERVAL_MS = { minimum: 2_800, maximum: 6_500 }
export const EAR_INTERVAL_MS = { minimum: 6_000, maximum: 12_000 }
export const REDUCED_BLINK_INTERVAL_MS = {
  minimum: 10_000,
  maximum: 16_000,
}

type TimerHandle = ReturnType<typeof globalThis.setTimeout>

export interface AnimationSchedulerTimers {
  setTimeout(callback: () => void, delay: number): TimerHandle
  clearTimeout(handle: TimerHandle): void
}

const browserTimers: AnimationSchedulerTimers = {
  setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimeout: (handle) => globalThis.clearTimeout(handle),
}

function randomInterval(
  range: { minimum: number; maximum: number },
  random: () => number,
) {
  const unit = Math.min(1, Math.max(0, random()))
  return range.minimum + (range.maximum - range.minimum) * unit
}

/** Owns all irregular one-shot timers so React cleanup has one stop point. */
export class LemurOneShotScheduler {
  private handles = new Set<TimerHandle>()
  private running = false

  constructor(
    private readonly playBlink: () => void,
    private readonly playEar: () => void,
    private readonly reducedMotion: boolean,
    private readonly random = Math.random,
    private readonly timers = browserTimers,
  ) {}

  start() {
    if (this.running) return
    this.running = true
    this.scheduleBlink()
    if (!this.reducedMotion) this.scheduleEar()
  }

  stop() {
    this.running = false
    for (const handle of this.handles) this.timers.clearTimeout(handle)
    this.handles.clear()
  }

  private schedule(
    callback: () => void,
    range: { minimum: number; maximum: number },
    repeat: () => void,
  ) {
    const handle = this.timers.setTimeout(
      () => {
        this.handles.delete(handle)
        if (!this.running) return
        callback()
        repeat()
      },
      randomInterval(range, this.random),
    )
    this.handles.add(handle)
  }

  private scheduleBlink() {
    this.schedule(
      this.playBlink,
      this.reducedMotion ? REDUCED_BLINK_INTERVAL_MS : BLINK_INTERVAL_MS,
      () => this.scheduleBlink(),
    )
  }

  private scheduleEar() {
    this.schedule(this.playEar, EAR_INTERVAL_MS, () => this.scheduleEar())
  }
}

function configureLoop(action: AnimationAction) {
  action.reset().setLoop(LoopRepeat, Infinity).setEffectiveWeight(1).play()
}

function playOneShot(action: AnimationAction) {
  action
    .reset()
    .setLoop(LoopOnce, 1)
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .play()
}

/** Central controller for mixer state, one-shots, reduced motion, and cleanup. */
export function useLemurAnimationController(root: Object3D, clips: LemurClips) {
  const reducedMotion = useReducedMotion()
  const mixer = useMemo(() => new AnimationMixer(root), [root])
  const actions = useMemo(
    () => ({
      breathing: mixer.clipAction(clips.Breathing),
      blink: mixer.clipAction(clips.Blink),
      ear: mixer.clipAction(clips.EarTwitch),
      tail: mixer.clipAction(clips.TailIdle),
    }),
    [clips, mixer],
  )

  useFrame((_, delta) => mixer.update(delta))

  useEffect(() => {
    if (!reducedMotion) {
      configureLoop(actions.breathing)
      configureLoop(actions.tail)
    }

    const scheduler = new LemurOneShotScheduler(
      () => playOneShot(actions.blink),
      () => playOneShot(actions.ear),
      reducedMotion,
    )
    scheduler.start()

    return () => {
      scheduler.stop()
      actions.breathing.stop()
      actions.tail.stop()
      actions.blink.stop()
      actions.ear.stop()
    }
  }, [actions, reducedMotion])

  useEffect(
    () => () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(root)
    },
    [mixer, root],
  )
}
