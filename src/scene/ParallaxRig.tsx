import { useFrame, useThree } from '@react-three/fiber'
import {
  createContext,
  type MutableRefObject,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { Group } from 'three'

import { useReducedMotion } from '../hooks/useReducedMotion'
import { PARALLAX_CONFIG } from './constants'
import {
  damp,
  getCameraPose,
  getHeroScrollProgress,
  normalizePointer,
  type NormalizedPoint,
} from './parallaxMath'

interface ParallaxMotion {
  pointer: NormalizedPoint
  scroll: number
}

const ParallaxContext = createContext<MutableRefObject<ParallaxMotion> | null>(
  null,
)

function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(pointer: coarse)')
    const update = () => {
      setCoarse(query.matches)
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return coarse
}

interface ParallaxRigProps {
  basePosition: readonly [number, number, number]
  children: ReactNode
}

export function ParallaxRig({ basePosition, children }: ParallaxRigProps) {
  const canvas = useThree((state) => state.gl.domElement)
  const reducedMotion = useReducedMotion()
  const coarsePointer = useCoarsePointer()
  const target = useRef<ParallaxMotion>({ pointer: { x: 0, y: 0 }, scroll: 0 })
  const motion = useRef<ParallaxMotion>({ pointer: { x: 0, y: 0 }, scroll: 0 })

  useEffect(() => {
    const resetPointer = () => {
      target.current.pointer = { x: 0, y: 0 }
    }
    const updateScroll = () => {
      target.current.scroll = reducedMotion
        ? 0
        : getHeroScrollProgress(canvas.getBoundingClientRect())
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion || coarsePointer || event.pointerType === 'touch') {
        resetPointer()
        return
      }
      target.current.pointer = normalizePointer(
        event.clientX,
        event.clientY,
        canvas.getBoundingClientRect(),
      )
    }

    resetPointer()
    updateScroll()
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', resetPointer)
    window.addEventListener('blur', resetPointer)
    window.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', updateScroll)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', resetPointer)
      window.removeEventListener('blur', resetPointer)
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('resize', updateScroll)
    }
  }, [canvas, coarsePointer, reducedMotion])

  useFrame(({ camera }, delta) => {
    if (reducedMotion) {
      motion.current.pointer = { x: 0, y: 0 }
      motion.current.scroll = 0
    } else {
      motion.current.pointer.x = damp(
        motion.current.pointer.x,
        target.current.pointer.x,
        PARALLAX_CONFIG.damping,
        delta,
      )
      motion.current.pointer.y = damp(
        motion.current.pointer.y,
        target.current.pointer.y,
        PARALLAX_CONFIG.damping,
        delta,
      )
      motion.current.scroll = damp(
        motion.current.scroll,
        target.current.scroll,
        PARALLAX_CONFIG.damping,
        delta,
      )
    }

    const pose = getCameraPose(
      basePosition,
      motion.current.pointer,
      motion.current.scroll,
    )
    camera.position.fromArray(pose.position)
    camera.lookAt(...pose.target)
  })

  return (
    <ParallaxContext.Provider value={motion}>
      {children}
    </ParallaxContext.Provider>
  )
}

interface ParallaxGroupProps {
  multiplier: number
  name?: string
  visible?: boolean
  children: ReactNode
}

export function ParallaxGroup({
  multiplier,
  name,
  visible,
  children,
}: ParallaxGroupProps) {
  const group = useRef<Group>(null)
  const motion = useContext(ParallaxContext)
  if (!motion) throw new Error('ParallaxGroup must be inside ParallaxRig')

  useFrame(() => {
    if (!group.current) return
    group.current.position.x =
      -motion.current.pointer.x * PARALLAX_CONFIG.groupTravel[0] * multiplier
    group.current.position.y =
      -motion.current.pointer.y * PARALLAX_CONFIG.groupTravel[1] * multiplier
  })

  return (
    <group ref={group} name={name} visible={visible}>
      {children}
    </group>
  )
}
