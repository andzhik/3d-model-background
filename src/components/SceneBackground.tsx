import { Canvas, type RootState } from '@react-three/fiber'
import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from 'react'

import { Experience } from '../scene/Experience'
import { CAMERA_CONFIG } from '../scene/constants'
import { createDefaultDebugSettings } from '../scene/debug'
import { DEFAULT_SCENE_QUALITY, SCENE_QUALITY } from '../scene/quality'
import { SceneDebug } from './SceneDebug'
import { sceneStatusReducer } from './sceneStatus'

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

export function SceneBackground() {
  const [debugSettings, setDebugSettings] = useState(createDefaultDebugSettings)
  const quality = SCENE_QUALITY[DEFAULT_SCENE_QUALITY]
  const [status, dispatch] = useReducer(
    sceneStatusReducer,
    canInitializeWebGL() ? 'loading' : 'fallback',
  )
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(
    null,
  )

  const handleCreated = useCallback((state: RootState) => {
    setCanvasElement(state.gl.domElement)
  }, [])

  const handleFirstFrame = useCallback(() => {
    dispatch({ type: 'first-frame' })
  }, [])

  const handleFailure = useCallback(() => {
    dispatch({ type: 'failure' })
  }, [])

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
        className="scene-background"
        data-scene-status={status}
        aria-hidden="true"
      >
        {status !== 'fallback' && (
          <SceneErrorBoundary onError={handleFailure}>
            <Canvas
              aria-hidden="true"
              camera={CAMERA_CONFIG}
              dpr={quality.dpr}
              shadows={quality.shadows}
              gl={{ alpha: true, antialias: quality.antialias }}
              onCreated={handleCreated}
            >
              <Experience
                onFirstFrame={handleFirstFrame}
                settings={debugSettings}
              />
            </Canvas>
          </SceneErrorBoundary>
        )}
      </div>
      {import.meta.env.DEV && (
        <SceneDebug settings={debugSettings} onChange={setDebugSettings} />
      )}
    </>
  )
}
