import { Canvas, type RootState } from '@react-three/fiber'
import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import { PCFShadowMap } from 'three'

import { useQualityTier } from '../hooks/useQualityTier'
import { useSceneVisibility } from '../hooks/useSceneVisibility'
import { Experience } from '../scene/Experience'
import { CAMERA_CONFIG } from '../scene/constants'
import { useResponsiveCameraPreset } from '../scene/cameraPresets'
import { createDefaultDebugSettings } from '../scene/debug'
import type { RendererStatistics } from '../scene/debug'
import { SCENE_QUALITY } from '../scene/quality'
import { SceneDebug } from './SceneDebug'
import { sceneStatusReducer } from './sceneStatus'
import type { SceneStatus } from './sceneStatus'

function canInitializeWebGL(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('WebGLRenderingContext' in window || 'WebGL2RenderingContext' in window)
  )
}

interface SceneErrorBoundaryProps {
  children: ReactNode
  onError: () => void
}

interface SceneErrorBoundaryState {
  failed: boolean
}

class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

interface SceneBackgroundProps {
  enabled?: boolean
  onStatusChange?: (status: SceneStatus) => void
}

export function SceneBackground({
  enabled = true,
  onStatusChange,
}: SceneBackgroundProps) {
  const sceneElement = useRef<HTMLDivElement>(null)
  const sceneVisible = useSceneVisibility(sceneElement)
  const cameraPreset = useResponsiveCameraPreset()
  const [debugSettings, setDebugSettings] = useState(createDefaultDebugSettings)
  const {
    quality: qualityTier,
    forcedQuality,
    setDevelopmentOverride,
    reportRuntimeFps,
  } = useQualityTier()
  const [rendererStatistics, setRendererStatistics] =
    useState<RendererStatistics | null>(null)
  const quality = SCENE_QUALITY[qualityTier]
  const [status, dispatch] = useReducer(
    sceneStatusReducer,
    canInitializeWebGL() ? 'loading' : 'fallback',
  )
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(
    null,
  )
  const posterOnly = qualityTier === 'poster-only'
  const effectiveStatus = posterOnly ? 'fallback' : status
  const renderActive =
    enabled && sceneVisible && !posterOnly && status !== 'fallback'

  const handleCreated = useCallback((state: RootState) => {
    state.gl.shadowMap.type = PCFShadowMap
    setCanvasElement(state.gl.domElement)
  }, [])

  const handleFirstFrame = useCallback(() => {
    dispatch({ type: 'first-frame' })
  }, [])

  const handleFailure = useCallback(() => {
    dispatch({ type: 'failure' })
  }, [])

  useEffect(() => {
    onStatusChange?.(effectiveStatus)
  }, [effectiveStatus, onStatusChange])

  useEffect(() => {
    if (!canvasElement) return

    const handleContextLost = (event: Event) => {
      event.preventDefault()
      handleFailure()
    }

    canvasElement.addEventListener('webglcontextlost', handleContextLost)
    return () => {
      canvasElement.removeEventListener('webglcontextlost', handleContextLost)
    }
  }, [canvasElement, handleFailure])

  return (
    <>
      <div
        ref={sceneElement}
        className="scene-background"
        data-scene-status={effectiveStatus}
        data-scene-quality={qualityTier}
        data-scene-active={renderActive ? 'true' : 'false'}
        data-camera-preset={cameraPreset.name}
        aria-hidden="true"
      >
        {status !== 'fallback' && !posterOnly && (
          <SceneErrorBoundary onError={handleFailure}>
            <Canvas
              aria-hidden="true"
              camera={{
                position: [...cameraPreset.position],
                fov: cameraPreset.fov,
                near: CAMERA_CONFIG.near,
                far: CAMERA_CONFIG.far,
              }}
              dpr={quality.dpr}
              frameloop={renderActive ? 'always' : 'never'}
              shadows={quality.shadows}
              gl={{ alpha: true, antialias: quality.antialias }}
              onCreated={handleCreated}
            >
              <Experience
                onFirstFrame={handleFirstFrame}
                onRendererStatistics={
                  import.meta.env.DEV ? setRendererStatistics : undefined
                }
                quality={qualityTier}
                active={renderActive}
                settings={debugSettings}
                cameraPreset={cameraPreset}
                onRuntimePerformance={reportRuntimeFps}
              />
            </Canvas>
          </SceneErrorBoundary>
        )}
      </div>
      {import.meta.env.DEV && (
        <SceneDebug
          settings={debugSettings}
          onChange={setDebugSettings}
          quality={qualityTier}
          forcedQuality={forcedQuality}
          renderActive={renderActive}
          onQualityChange={setDevelopmentOverride}
          rendererStatistics={rendererStatistics}
          cameraPreset={cameraPreset.name}
        />
      )}
    </>
  )
}
