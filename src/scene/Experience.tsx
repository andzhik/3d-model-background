import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Suspense } from 'react'
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three'

import { useReducedMotion } from '../hooks/useReducedMotion'
import {
  CAMERA_PRESETS,
  CAMERA_TRANSITION,
  type CameraPreset,
} from './cameraPresets'
import { CAMERA_CONFIG, FOG_CONFIG, LIGHT_CONFIG } from './constants'
import { Clouds, SkyGradient, SunDisc } from './Atmosphere'
import type { SceneDebugSettings } from './debug'
import { Mountains } from './Mountains'
import { SCENE_PALETTE } from './palette'
import { Lake } from './Lake'
import { Lemur } from './Lemur'
import { Foreground } from './Foreground'
import type { RendererStatistics } from './debug'
import { SCENE_QUALITY, type SceneQuality } from './quality'
import { Vegetation } from './Vegetation'
import { ParallaxRig } from './ParallaxRig'
import { damp } from './parallaxMath'

interface ExperienceProps {
  active: boolean
  onFirstFrame: () => void
  onRendererStatistics?: (statistics: RendererStatistics) => void
  onRuntimePerformance?: (averageFps: number) => void
  quality: SceneQuality
  settings: SceneDebugSettings
  cameraPreset: CameraPreset
}

const PERFORMANCE_WARMUP_FRAMES = 30
const PERFORMANCE_SAMPLE_FRAMES = 120

function RuntimePerformanceSampler({
  quality,
  onReport,
}: {
  quality: SceneQuality
  onReport: (averageFps: number) => void
}) {
  const sample = useRef({ warmup: 0, frames: 0, seconds: 0 })

  useEffect(() => {
    sample.current = { warmup: 0, frames: 0, seconds: 0 }
  }, [quality])

  useFrame((_, delta) => {
    // Ignore resume gaps and debugger pauses; they do not describe render cost.
    if (delta <= 0 || delta > 0.25) return
    if (sample.current.warmup < PERFORMANCE_WARMUP_FRAMES) {
      sample.current.warmup += 1
      return
    }
    sample.current.frames += 1
    sample.current.seconds += delta
    if (sample.current.frames < PERFORMANCE_SAMPLE_FRAMES) return

    onReport(sample.current.frames / sample.current.seconds)
    sample.current = { warmup: 0, frames: 0, seconds: 0 }
  })

  return null
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

interface CameraConfigurationProps {
  fov: number
}

function CameraConfiguration({ fov }: CameraConfigurationProps) {
  const camera = useRef<ThreePerspectiveCamera>(null)
  const reducedMotion = useReducedMotion()

  useFrame((_, delta) => {
    if (!camera.current) return
    const nextFov = reducedMotion
      ? fov
      : damp(camera.current.fov, fov, CAMERA_TRANSITION.damping, delta)
    if (Math.abs(camera.current.fov - nextFov) < 0.0001) return
    camera.current.fov = nextFov
    camera.current.updateProjectionMatrix()
  })

  return (
    <PerspectiveCamera
      ref={camera}
      makeDefault
      position={CAMERA_PRESETS['desktop-landscape'].position}
      fov={CAMERA_PRESETS['desktop-landscape'].fov}
      near={CAMERA_CONFIG.near}
      far={CAMERA_CONFIG.far}
    />
  )
}

export function Experience({
  active,
  onFirstFrame,
  onRendererStatistics,
  onRuntimePerformance,
  quality,
  settings,
  cameraPreset,
}: ExperienceProps) {
  const qualitySettings = SCENE_QUALITY[quality]
  const cameraPosition: [number, number, number] = [
    cameraPreset.position[0] + settings.cameraOffset[0],
    cameraPreset.position[1] + settings.cameraOffset[1],
    cameraPreset.position[2] + settings.cameraOffset[2],
  ]
  const fov = cameraPreset.fov + settings.fovOffset

  return (
    <>
      <CameraConfiguration fov={fov} />
      <ParallaxRig basePosition={cameraPosition}>
        <fog
          attach="fog"
          args={[FOG_CONFIG.color, settings.fogNear, settings.fogFar]}
        />
        <group visible={settings.visibility.environment}>
          <SkyGradient />
          <SunDisc position={cameraPreset.sunPosition} />
          <hemisphereLight
            args={[
              SCENE_PALETTE.skyLight,
              SCENE_PALETTE.groundFill,
              LIGHT_CONFIG.hemisphereIntensity,
            ]}
          />
          <ambientLight
            color={SCENE_PALETTE.ambientFill}
            intensity={LIGHT_CONFIG.ambientIntensity}
          />
          <directionalLight
            position={LIGHT_CONFIG.keyPosition}
            intensity={settings.lightIntensity}
            color={SCENE_PALETTE.sunrise}
            castShadow={qualitySettings.shadows}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
        </group>
        <Clouds
          farVisible={settings.visibility.distantWorld}
          nearVisible={
            settings.visibility.middleWorld &&
            qualitySettings.effects.nearClouds
          }
        />
        <Vegetation
          quality={quality}
          distantVisible={settings.visibility.distantWorld}
          middleVisible={settings.visibility.middleWorld}
          foregroundVisible={settings.visibility.foreground}
          details={cameraPreset.details}
        />
        <Suspense fallback={null}>
          <Mountains visible={settings.visibility.distantWorld} />
          <Lake
            visible={settings.visibility.middleWorld}
            quality={qualitySettings.water}
            showReflection={qualitySettings.effects.sunReflection}
          />
          <Foreground
            middleVisible={settings.visibility.middleWorld}
            foregroundVisible={settings.visibility.foreground}
            details={cameraPreset.details}
          />
          <Lemur
            visible={settings.visibility.foreground}
            shadows={qualitySettings.shadows}
            animationActive={active}
          />
          {qualitySettings.shadows && (
            <mesh
              name="LemurShadowCatcher"
              position={[0, -1.47, -0.15]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[5.2, 4.2]} />
              <shadowMaterial transparent opacity={0.2} />
            </mesh>
          )}
          <FirstFrameReporter onFirstFrame={onFirstFrame} />
        </Suspense>
        {onRendererStatistics && (
          <RendererStatisticsReporter onReport={onRendererStatistics} />
        )}
        {onRuntimePerformance && (
          <RuntimePerformanceSampler
            quality={quality}
            onReport={onRuntimePerformance}
          />
        )}
      </ParallaxRig>
    </>
  )
}
