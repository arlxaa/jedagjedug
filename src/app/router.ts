import { useEffect, useState } from 'react'

/** Minimal client router. No dependency; supports /, /callback, /player, etc. */
export function useRoute(): [string, (to: string) => void] {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to: string) => {
    if (to === window.location.pathname) return
    window.history.pushState({}, '', to)
    setPath(to)
  }

  return [path, navigate]
}
