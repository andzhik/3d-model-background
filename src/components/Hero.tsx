import '../styles/hero.css'

import { useCallback, useState } from 'react'

import { SceneBackground } from './SceneBackground'
import type { SceneStatus } from './sceneStatus'

export function Hero() {
  const [sceneEnabled, setSceneEnabled] = useState(true)
  const [sceneStatus, setSceneStatus] = useState<SceneStatus>('loading')
  const handleSceneStatusChange = useCallback((status: SceneStatus) => {
    setSceneStatus(status)
  }, [])
  const showPoster = !sceneEnabled || sceneStatus !== 'ready'

  return (
    <main>
      <section
        className={`hero${showPoster ? ' hero--poster-visible' : ''}${
          sceneEnabled ? '' : ' hero--poster-mode'
        }`}
        aria-labelledby="hero-title"
      >
        <SceneBackground onStatusChange={handleSceneStatusChange} />
        <label className="hero__scene-toggle">
          <input
            type="checkbox"
            role="switch"
            checked={sceneEnabled}
            disabled={sceneStatus === 'fallback'}
            onChange={(event) => setSceneEnabled(event.target.checked)}
          />
          <span>3D scene</span>
        </label>
        <div className="hero__content">
          <p className="hero__eyebrow">Find your center</p>
          <h1 id="hero-title">Stillness in the wild</h1>
          <p className="hero__subtitle">
            Pause, breathe, and meet the quiet beyond the trail.
          </p>
          <a className="hero__cta" href="#begin">
            Begin the journey
          </a>
        </div>
      </section>
      <div id="begin" className="sr-only" tabIndex={-1}>
        Your journey begins here.
      </div>
    </main>
  )
}
