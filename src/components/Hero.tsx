import '../styles/hero.css'

export function Hero() {
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
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
