import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, type ShaderMaterial } from 'three'

import { useReducedMotion } from '../hooks/useReducedMotion'
import { PARALLAX_CONFIG, WATER_CONFIG } from './constants'
import { SCENE_PALETTE } from './palette'
import { ParallaxGroup } from './ParallaxRig'
import type { SceneQualitySettings } from './quality'
import {
  getWaterAnimationTime,
  REFLECTION_FRAGMENT_SHADER,
  WATER_FRAGMENT_SHADER,
  WATER_VERTEX_SHADER,
} from './waterShader'

interface LakeProps {
  visible: boolean
  quality: SceneQualitySettings['water']
  showReflection: boolean
}

export function Lake({ visible, quality, showReflection }: LakeProps) {
  const reducedMotion = useReducedMotion()
  const waterMaterial = useRef<ShaderMaterial>(null)
  const reflectionMaterial = useRef<ShaderMaterial>(null)
  const waterUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: {
        value: WATER_CONFIG.amplitude * quality.amplitudeMultiplier,
      },
      uForegroundColor: { value: new Color(SCENE_PALETTE.waterForeground) },
      uHorizonColor: { value: new Color(SCENE_PALETTE.waterHorizon) },
      uFacetColor: { value: new Color(SCENE_PALETTE.waterFacet) },
    }),
    [quality.amplitudeMultiplier],
  )
  const reflectionUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: {
        value: WATER_CONFIG.amplitude * quality.amplitudeMultiplier,
      },
      uReflectionColor: { value: new Color(SCENE_PALETTE.waterReflection) },
      uReflectionWidth: { value: WATER_CONFIG.reflectionWidth },
    }),
    [quality.amplitudeMultiplier],
  )

  useFrame(({ clock }) => {
    const time = getWaterAnimationTime(
      clock.getElapsedTime(),
      reducedMotion || !quality.animated,
    )
    if (waterMaterial.current) waterMaterial.current.uniforms.uTime.value = time
    if (reflectionMaterial.current) {
      reflectionMaterial.current.uniforms.uTime.value = time
    }
  })

  const geometryArgs = [
    WATER_CONFIG.width,
    WATER_CONFIG.length,
    quality.widthSegments,
    quality.lengthSegments,
  ] as const

  return (
    <ParallaxGroup
      name="MiddleWorldLake"
      visible={visible}
      multiplier={PARALLAX_CONFIG.multipliers.mountainsNear}
    >
      <mesh
        name="LakeSurface"
        position={WATER_CONFIG.position}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={geometryArgs} />
        <shaderMaterial
          ref={waterMaterial}
          vertexShader={WATER_VERTEX_SHADER}
          fragmentShader={WATER_FRAGMENT_SHADER}
          uniforms={waterUniforms}
        />
      </mesh>
      {showReflection && (
        <mesh
          name="SunReflection"
          position={[
            WATER_CONFIG.position[0],
            WATER_CONFIG.position[1] + WATER_CONFIG.reflectionLift,
            WATER_CONFIG.position[2],
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={2}
        >
          <planeGeometry args={geometryArgs} />
          <shaderMaterial
            ref={reflectionMaterial}
            vertexShader={WATER_VERTEX_SHADER}
            fragmentShader={REFLECTION_FRAGMENT_SHADER}
            uniforms={reflectionUniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </ParallaxGroup>
  )
}
