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
    <div
      className="scene-background"
      data-scene-status={status}
      aria-hidden="true"
    >
      {status !== 'fallback' && (
        <SceneErrorBoundary onError={handleFailure}>
          <Canvas
            aria-hidden="true"
            camera={{ position: [0, 0, 5], fov: 42, near: 0.1, far: 100 }}
            dpr={[1, 1.5]}
            gl={{ alpha: true, antialias: true }}
            onCreated={handleCreated}
          >
            <Experience onFirstFrame={handleFirstFrame} />
          </Canvas>
        </SceneErrorBoundary>
      )}
    </div>
  )
}
