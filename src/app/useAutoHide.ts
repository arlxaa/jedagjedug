import { useCallback, useEffect, useRef, useState } from 'react'

/** Hide chrome after `ms` of no pointer/touch/key activity; `poke()` reveals it. */
export function useAutoHide(ms = 3000): [boolean, () => void] {
  const [visible, setVisible] = useState(true)
  const timer = useRef<number | null>(null)

  const poke = useCallback(() => {
    setVisible(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVisible(false), ms)
  }, [ms])

  useEffect(() => {
    poke()
    const onAct = () => poke()
    window.addEventListener('pointermove', onAct)
    window.addEventListener('pointerdown', onAct)
    window.addEventListener('keydown', onAct)
    window.addEventListener('touchstart', onAct)
    return () => {
      window.removeEventListener('pointermove', onAct)
      window.removeEventListener('pointerdown', onAct)
      window.removeEventListener('keydown', onAct)
      window.removeEventListener('touchstart', onAct)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [poke])

  return [visible, poke]
}
