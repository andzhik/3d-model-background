import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import type { Mesh } from 'three'

import { LEMUR_CONFIG, PARALLAX_CONFIG } from './constants'
import { useLemurAnimationController } from './lemurAnimation'
import { validateLemurAnimations, validateLemurNodes } from './lemurAsset'
import { cloneWithScenePalette } from './materials'
import { ParallaxGroup } from './ParallaxRig'

interface LemurProps {
  visible?: boolean
  shadows?: boolean
  animationActive?: boolean
}

export function Lemur({
  visible = true,
  shadows = false,
  animationActive = true,
}: LemurProps) {
  const { animations, nodes } = useGLTF(LEMUR_CONFIG.modelUrl)
  const root = useMemo(() => {
    const validated = validateLemurNodes(nodes)
    return cloneWithScenePalette(validated.Root)
  }, [nodes])
  const clips = useMemo(() => validateLemurAnimations(animations), [animations])
  useLemurAnimationController(root, clips, animationActive)

  useEffect(() => {
    root.traverse((object) => {
      if ('isMesh' in object && object.isMesh === true) {
        const mesh = object as Mesh
        mesh.castShadow = shadows
      }
    })
  }, [root, shadows])

  return (
    <ParallaxGroup
      name="LemurRig"
      visible={visible}
      multiplier={PARALLAX_CONFIG.multipliers.lemur}
    >
      <group
        position={LEMUR_CONFIG.position}
        rotation={LEMUR_CONFIG.rotation}
        scale={LEMUR_CONFIG.scale}
        dispose={null}
      >
        <primitive object={root} />
      </group>
    </ParallaxGroup>
  )
}
