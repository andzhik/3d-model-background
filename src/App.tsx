import { lazy, Suspense } from 'react'

import { Hero } from './components/Hero'

const LemurReview = lazy(() =>
  import('./components/LemurReview').then(({ LemurReview: component }) => ({
    default: component,
  })),
)

function App() {
  const reviewAsset = new URLSearchParams(window.location.search).get('review')

  if (reviewAsset === 'lemur-full-3d') {
    return (
      <Suspense fallback={<main>Loading staging model reviewer…</main>}>
        <LemurReview />
      </Suspense>
    )
  }

  return <Hero />
}

export default App
