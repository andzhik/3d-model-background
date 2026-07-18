import { useEffect, useState, type RefObject } from 'react'

function pageIsVisible() {
  return (
    typeof document === 'undefined' || document.visibilityState !== 'hidden'
  )
}

export function useSceneVisibility(element: RefObject<Element | null>) {
  const [pageVisible, setPageVisible] = useState(pageIsVisible)
  const [intersecting, setIntersecting] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => setPageVisible(pageIsVisible())
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    const target = element.current
    if (!target || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry?.isIntersecting === true),
      { threshold: 0 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [element])

  return pageVisible && intersecting
}
