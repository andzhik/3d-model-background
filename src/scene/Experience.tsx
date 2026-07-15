import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

interface ExperienceProps {
  onFirstFrame: () => void
}

function FirstFrameReporter({ onFirstFrame }: ExperienceProps) {
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

export function Experience({ onFirstFrame }: ExperienceProps) {
  return (
    <>
      <color attach="background" args={['#7895c1']} />
      <hemisphereLight args={['#cfe2ff', '#2f3355', 1.8]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} color="#ffd6a3" />
      <mesh rotation={[0.28, 0.58, 0]}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial
          color="#f08b73"
          flatShading
          roughness={0.78}
          metalness={0}
        />
      </mesh>
      <FirstFrameReporter onFirstFrame={onFirstFrame} />
    </>
  )
}
