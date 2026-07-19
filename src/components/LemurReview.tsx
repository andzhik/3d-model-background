import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from 'react'
import {
  AnimationMixer,
  Box3,
  Color,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

import lemurReferenceUrl from '../../images/yoge-lemur.png'
import '../styles/lemur-review.css'

const MODEL_URL = '/models/lemur-full-3d.glb'

type ReviewView =
  'front' | 'back' | 'left' | 'right' | 'front-left' | 'front-right'

interface ModelInfo {
  clips: string[]
  materials: number
  meshes: number
  triangles: number
}

interface Framing {
  center: Vector3
  distance: number
}

const VIEW_DIRECTIONS: Record<ReviewView, [number, number, number]> = {
  front: [0, 0, 1],
  back: [0, 0, -1],
  left: [-1, 0, 0],
  right: [1, 0, 0],
  'front-left': [-1, 0.25, 1],
  'front-right': [1, 0.25, 1],
}

function CameraRig({ framing, view }: { framing: Framing; view: ReviewView }) {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null)
  const appliedView = useRef('')
  const signature = `${view}:${framing.center.toArray().join(',')}:${framing.distance}`

  useFrame(({ camera }) => {
    if (appliedView.current === signature) return
    const direction = new Vector3(...VIEW_DIRECTIONS[view]).normalize()
    camera.position
      .copy(framing.center)
      .addScaledVector(direction, framing.distance)
    camera.near = Math.max(framing.distance / 100, 0.01)
    camera.far = framing.distance * 10
    camera.lookAt(framing.center)
    camera.updateProjectionMatrix()
    controls.current?.target.copy(framing.center)
    controls.current?.update()
    appliedView.current = signature
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={framing.distance * 0.2}
      maxDistance={framing.distance * 4}
      target={framing.center}
    />
  )
}

function ReviewModel({
  activeClip,
  playing,
  wireframe,
  onFraming,
  onInfo,
}: {
  activeClip: string
  playing: boolean
  wireframe: boolean
  onFraming: (framing: Framing) => void
  onInfo: (info: ModelInfo) => void
}) {
  const { animations, scene } = useGLTF(MODEL_URL)
  const root = useMemo(() => cloneSkeleton(scene), [scene])
  const mixer = useMemo(() => new AnimationMixer(root), [root])

  useEffect(() => {
    const materials = new Set()
    let meshes = 0
    let triangles = 0

    root.traverse((object) => {
      if (!(object instanceof Mesh)) return
      meshes += 1
      const geometry = object.geometry
      triangles += geometry.index
        ? geometry.index.count / 3
        : geometry.attributes.position.count / 3
      const sourceMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      const reviewMaterials = sourceMaterials.map((material) => {
        const cloned = material.clone()
        if (cloned instanceof MeshStandardMaterial) cloned.wireframe = wireframe
        materials.add(material.uuid)
        return cloned
      })
      object.material = Array.isArray(object.material)
        ? reviewMaterials
        : reviewMaterials[0]
      object.castShadow = true
      object.receiveShadow = true
    })

    const bounds = new Box3().setFromObject(root)
    const center = bounds.getCenter(new Vector3())
    const size = bounds.getSize(new Vector3())
    onFraming({ center, distance: Math.max(size.x, size.y, size.z) * 2.1 })
    onInfo({
      clips: animations.map((clip) => clip.name),
      materials: materials.size,
      meshes,
      triangles: Math.round(triangles),
    })
  }, [animations, onFraming, onInfo, root, wireframe])

  useEffect(() => {
    mixer.stopAllAction()
    if (!playing || !activeClip) return
    const clip = animations.find((candidate) => candidate.name === activeClip)
    if (clip) mixer.clipAction(clip).reset().play()
    return () => {
      mixer.stopAllAction()
    }
  }, [activeClip, animations, mixer, playing])

  useFrame((_, delta) => {
    if (playing) mixer.update(delta)
  })

  useEffect(
    () => () => {
      mixer.stopAllAction()
    },
    [mixer],
  )

  return <primitive object={root} dispose={null} />
}

export function LemurReview() {
  const [view, setView] = useState<ReviewView>('front-right')
  const [wireframe, setWireframe] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [activeClip, setActiveClip] = useState('')
  const [framing, setFraming] = useState<Framing>({
    center: new Vector3(0, 1.35, 0),
    distance: 6,
  })
  const [info, setInfo] = useState<ModelInfo>({
    clips: [],
    materials: 0,
    meshes: 0,
    triangles: 0,
  })

  const handleInfo = useCallback((nextInfo: ModelInfo) => {
    setInfo(nextInfo)
    setActiveClip((current) => current || nextInfo.clips[0] || '')
  }, [])

  return (
    <main className="lemur-review">
      <section
        className="lemur-review__viewport"
        aria-label="Interactive staging model"
      >
        <Canvas
          camera={{ fov: 36, position: [4, 3, 6] }}
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true }}
          onCreated={({ gl }) => gl.setClearColor(new Color('#242830'))}
        >
          <ambientLight intensity={0.9} />
          <directionalLight castShadow intensity={3.2} position={[-4, 6, 5]} />
          <directionalLight intensity={1.5} position={[4, 3, 2]} />
          <directionalLight intensity={1.8} position={[0, 4, -5]} />
          <gridHelper args={[12, 24, '#667080', '#3c424d']} />
          <Suspense fallback={null}>
            <ReviewModel
              activeClip={activeClip}
              playing={playing}
              wireframe={wireframe}
              onFraming={setFraming}
              onInfo={handleInfo}
            />
          </Suspense>
          <CameraRig framing={framing} view={view} />
        </Canvas>
      </section>

      <aside className="lemur-review__panel">
        <p className="lemur-review__eyebrow">Staging asset review</p>
        <h1>Full-3D lemur</h1>
        <p>
          Orbit with drag, zoom with the wheel, and use the locked directions to
          inspect the actual staging GLB. This does not alter the production
          scene.
        </p>

        <fieldset>
          <legend>Canonical direction</legend>
          <div className="lemur-review__button-grid">
            {(Object.keys(VIEW_DIRECTIONS) as ReviewView[]).map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={view === name}
                onClick={() => setView(name)}
              >
                {name.replace('-', ' ')}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="lemur-review__check">
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(event) => setWireframe(event.target.checked)}
          />
          Wireframe inspection
        </label>

        {info.clips.length > 0 ? (
          <div className="lemur-review__animation">
            <label htmlFor="review-clip">Animation clip</label>
            <select
              id="review-clip"
              value={activeClip}
              onChange={(event) => setActiveClip(event.target.value)}
            >
              {info.clips.map((clip) => (
                <option key={clip}>{clip}</option>
              ))}
            </select>
            <button type="button" onClick={() => setPlaying((value) => !value)}>
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>
        ) : (
          <p className="lemur-review__muted">
            No animation clips in this stage.
          </p>
        )}

        <dl className="lemur-review__stats">
          <div>
            <dt>Meshes</dt>
            <dd>{info.meshes}</dd>
          </div>
          <div>
            <dt>Triangles</dt>
            <dd>{info.triangles.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Materials</dt>
            <dd>{info.materials}</dd>
          </div>
          <div>
            <dt>Clips</dt>
            <dd>{info.clips.length}</dd>
          </div>
        </dl>

        <details>
          <summary>Reference image</summary>
          <img
            src={lemurReferenceUrl}
            alt="Original low-poly lemur reference"
          />
        </details>

        <p className="lemur-review__notice">
          Approve from the versioned contact sheet and checklist; use this
          viewer to investigate depth, topology, and motion from arbitrary
          angles.
        </p>
        <a href="/">Return to production page</a>
      </aside>
    </main>
  )
}

useGLTF.preload(MODEL_URL)
