import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Suspense } from 'react'

import { CAMERA_CONFIG, FOG_CONFIG, LIGHT_CONFIG } from './constants'
import { Clouds, SkyGradient, SunDisc } from './Atmosphere'
import type { SceneDebugSettings } from './debug'
import { Mountains } from './Mountains'
import { SCENE_PALETTE } from './palette'
import { Lake } from './Lake'

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
      <fog
        attach="fog"
        args={[FOG_CONFIG.color, settings.fogNear, settings.fogFar]}
      />
      <group visible={settings.visibility.environment}>
        <SkyGradient />
        <SunDisc />
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
      <Clouds
        farVisible={settings.visibility.distantWorld}
        nearVisible={settings.visibility.middleWorld}
      />
      <Suspense fallback={null}>
        <Mountains visible={settings.visibility.distantWorld} />
        <Lake visible={settings.visibility.middleWorld} />
        <FirstFrameReporter onFirstFrame={onFirstFrame} />
      </Suspense>
    </>
  )
}
