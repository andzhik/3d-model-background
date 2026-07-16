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
import { Foreground } from './Foreground'
import type { RendererStatistics } from './debug'
import type { SceneQuality } from './quality'
import { Vegetation } from './Vegetation'

interface ExperienceProps {
  onFirstFrame: () => void
  onRendererStatistics?: (statistics: RendererStatistics) => void
  quality: SceneQuality
  settings: SceneDebugSettings
}

function RendererStatisticsReporter({
  onReport,
}: {
  onReport: (statistics: RendererStatistics) => void
}) {
  const lastReport = useRef(-1)

  useFrame(({ clock, gl }) => {
    const elapsed = clock.getElapsedTime()
    if (elapsed - lastReport.current < 1) return
    lastReport.current = elapsed
    onReport({
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
    })
  })

  return null
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

export function Experience({
  onFirstFrame,
  onRendererStatistics,
  quality,
  settings,
}: ExperienceProps) {
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
      <Vegetation
        quality={quality}
        distantVisible={settings.visibility.distantWorld}
        middleVisible={settings.visibility.middleWorld}
        foregroundVisible={settings.visibility.foreground}
      />
      <Suspense fallback={null}>
        <Mountains visible={settings.visibility.distantWorld} />
        <Lake visible={settings.visibility.middleWorld} />
        <Foreground
          middleVisible={settings.visibility.middleWorld}
          foregroundVisible={settings.visibility.foreground}
        />
        <FirstFrameReporter onFirstFrame={onFirstFrame} />
      </Suspense>
      {onRendererStatistics && (
        <RendererStatisticsReporter onReport={onRendererStatistics} />
      )}
    </>
  )
}
