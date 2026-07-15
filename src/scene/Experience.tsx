import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

import {
  CAMERA_CONFIG,
  FOG_CONFIG,
  LIGHT_CONFIG,
  PLACEHOLDER_CONFIG,
} from './constants'
import type { SceneDebugSettings } from './debug'
import { lowPolyMaterialParameters } from './materials'
import { SCENE_PALETTE } from './palette'

interface ExperienceProps {
  onFirstFrame: () => void
  settings: SceneDebugSettings
}

function FirstFrameReporter({
  onFirstFrame,
}: Pick<ExperienceProps, 'onFirstFrame'>) {
  const reported = useRef(false)
  const frameRequest = useRef<number | null>(null)

  useFrame(({ camera, gl }) => {
    if (reported.current || gl.getContext().isContextLost()) return

    const cameraIsValid = camera.matrixWorld.elements.every(Number.isFinite)
    if (!cameraIsValid) return

    reported.current = true
    frameRequest.current = window.requestAnimationFrame(onFirstFrame)
  })

  useEffect(
    () => () => {
      if (frameRequest.current !== null) {
        window.cancelAnimationFrame(frameRequest.current)
      }
    },
    [],
  )

  return null
}

const placeholderMaterial = lowPolyMaterialParameters(SCENE_PALETTE.coral)

function CameraConfiguration({ settings }: Pick<ExperienceProps, 'settings'>) {
  return (
    <PerspectiveCamera
      makeDefault
      position={settings.cameraPosition}
      fov={settings.fov}
      near={CAMERA_CONFIG.near}
      far={CAMERA_CONFIG.far}
    />
  )
}

export function Experience({ onFirstFrame, settings }: ExperienceProps) {
  return (
    <>
      <CameraConfiguration settings={settings} />
      <color attach="background" args={[SCENE_PALETTE.sky]} />
      <fog
        attach="fog"
        args={[FOG_CONFIG.color, settings.fogNear, settings.fogFar]}
      />
      <group visible={settings.visibility.environment}>
        <hemisphereLight
          args={[
            SCENE_PALETTE.skyLight,
            SCENE_PALETTE.groundFill,
            LIGHT_CONFIG.hemisphereIntensity,
          ]}
        />
        <ambientLight intensity={LIGHT_CONFIG.ambientIntensity} />
        <directionalLight
          position={LIGHT_CONFIG.keyPosition}
          intensity={settings.lightIntensity}
          color={SCENE_PALETTE.sunrise}
        />
      </group>
      <group visible={settings.visibility.foreground}>
        <mesh rotation={PLACEHOLDER_CONFIG.rotation}>
          <icosahedronGeometry
            args={[PLACEHOLDER_CONFIG.radius, PLACEHOLDER_CONFIG.detail]}
          />
          <meshStandardMaterial {...placeholderMaterial} />
        </mesh>
      </group>
      <FirstFrameReporter onFirstFrame={onFirstFrame} />
    </>
  )
}
