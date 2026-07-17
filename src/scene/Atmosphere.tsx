import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, DoubleSide, Shape, type Group } from 'three'

import { useReducedMotion } from '../hooks/useReducedMotion'
import {
  createCloudPlacements,
  getCloudXAtTime,
  type CloudLayerName,
} from './cloudLayout'
import { ATMOSPHERE_CONFIG, PARALLAX_CONFIG } from './constants'
import { SCENE_PALETTE } from './palette'
import { ParallaxGroup } from './ParallaxRig'

const SKY_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uMiddle;
  uniform vec3 uHorizon;
  varying vec2 vUv;

  void main() {
    float lowerBlend = smoothstep(0.0, 0.48, vUv.y);
    float upperBlend = smoothstep(0.42, 1.0, vUv.y);
    vec3 lowerSky = mix(uHorizon, uMiddle, lowerBlend);
    vec3 color = mix(lowerSky, uZenith, upperBlend);
    gl_FragColor = vec4(color, 1.0);
  }
`

function createCloudShape(variant: number): Shape {
  const peaks = [
    [0.38, 0.78, 0.58],
    [0.48, 0.68, 0.46],
    [0.33, 0.72, 0.66],
  ][variant]
  const shape = new Shape()

  shape.moveTo(-1.35, -0.32)
  shape.lineTo(-1.18, 0.08)
  shape.lineTo(-0.78, peaks[0])
  shape.lineTo(-0.32, 0.48)
  shape.lineTo(0.08, peaks[1])
  shape.lineTo(0.55, peaks[2])
  shape.lineTo(0.92, 0.36)
  shape.lineTo(1.34, 0.05)
  shape.lineTo(1.22, -0.3)
  shape.lineTo(0.42, -0.42)
  shape.lineTo(-0.46, -0.4)
  shape.closePath()
  return shape
}

interface CloudLayerProps {
  layerName: CloudLayerName
  reducedMotion: boolean
}

function CloudLayer({ layerName, reducedMotion }: CloudLayerProps) {
  const group = useRef<Group>(null)
  const placements = useMemo(
    () => createCloudPlacements(layerName),
    [layerName],
  )
  const shapes = useMemo(
    () => [0, 1, 2].map((variant) => createCloudShape(variant)),
    [],
  )
  const config = ATMOSPHERE_CONFIG.clouds[layerName]
  const color =
    layerName === 'far' ? SCENE_PALETTE.cloudFar : SCENE_PALETTE.cloudNear

  useFrame(({ clock }) => {
    if (!group.current) return

    const elapsedSeconds = reducedMotion ? 0 : clock.getElapsedTime()
    group.current.children.forEach((cloud, index) => {
      const placement = placements[index]
      cloud.position.x = getCloudXAtTime(
        placement.x,
        elapsedSeconds,
        config.speed,
      )
    })
  })

  return (
    <group
      ref={group}
      position={[0, 0, config.z]}
      name={`CloudLayer${layerName}`}
    >
      {placements.map((placement, index) => (
        <mesh
          key={`${layerName}-${index}`}
          position={[placement.x, placement.y, 0]}
          scale={[placement.scale * 1.65, placement.scale, 1]}
        >
          <shapeGeometry args={[shapes[placement.variant]]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={config.opacity}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export function SkyGradient() {
  return (
    <mesh position={ATMOSPHERE_CONFIG.sky.position} renderOrder={-3}>
      <planeGeometry args={ATMOSPHERE_CONFIG.sky.size} />
      <shaderMaterial
        vertexShader={SKY_VERTEX_SHADER}
        fragmentShader={SKY_FRAGMENT_SHADER}
        uniforms={{
          uZenith: { value: new Color(SCENE_PALETTE.skyZenith) },
          uMiddle: { value: new Color(SCENE_PALETTE.skyMiddle) },
          uHorizon: { value: new Color(SCENE_PALETTE.skyHorizon) },
        }}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}

export function SunDisc() {
  return (
    <mesh position={ATMOSPHERE_CONFIG.sun.position} renderOrder={-2}>
      <circleGeometry
        args={[ATMOSPHERE_CONFIG.sun.radius, ATMOSPHERE_CONFIG.sun.segments]}
      />
      <meshBasicMaterial
        color={SCENE_PALETTE.sunCore}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  )
}

interface CloudsProps {
  farVisible: boolean
  nearVisible: boolean
}

export function Clouds({ farVisible, nearVisible }: CloudsProps) {
  const reducedMotion = useReducedMotion()

  return (
    <>
      <ParallaxGroup
        name="CloudParallaxFar"
        visible={farVisible}
        multiplier={PARALLAX_CONFIG.multipliers.cloudsFar}
      >
        <CloudLayer layerName="far" reducedMotion={reducedMotion} />
      </ParallaxGroup>
      <ParallaxGroup
        name="CloudParallaxNear"
        visible={nearVisible}
        multiplier={PARALLAX_CONFIG.multipliers.cloudsNear}
      >
        <CloudLayer layerName="near" reducedMotion={reducedMotion} />
      </ParallaxGroup>
    </>
  )
}
