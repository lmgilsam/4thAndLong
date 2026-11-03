import { useEffect, useRef, useState } from 'react'
import { reducedMotion } from './fx'

/** Animates a number toward `target` like a scoreboard ticking up. */
export function useCountUp(target: number, ms = 700, from?: number): number {
  const [shown, setShown] = useState(from ?? target)
  const shownRef = useRef(from ?? target)

  useEffect(() => {
    const start = shownRef.current
    if (start === target || reducedMotion()) {
      shownRef.current = target
      const id = requestAnimationFrame(() => setShown(target))
      return () => cancelAnimationFrame(id)
    }
    const t0 = performance.now()
    const frame = { id: 0 }
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      const eased = 1 - Math.pow(1 - k, 3)
      const v = Math.round(start + (target - start) * eased)
      shownRef.current = v
      setShown(v)
      if (k < 1) frame.id = requestAnimationFrame(step)
    }
    frame.id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.id)
  }, [target, ms])

  return shown
}
