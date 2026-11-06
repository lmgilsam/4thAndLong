// Every frame is a pure function of the time t (seconds), so the recorder can
// step it frame by frame: window.__setT(t) renders that moment. Without
// ?capture the scene just plays in real time, looping. ?t=12 starts at 12s.
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { FinalPlay } from './FinalPlay'
import { DURATION, LINES, MURMUR, SFX, type Line, type Sfx } from './timeline'

declare global {
  interface Window { __setT?: (t: number) => void; __adReady?: boolean; __adDuration?: number; __adLines?: Line[]; __adSfx?: Sfx[]; __adMurmur?: [number, number][] }
}

const params = new URLSearchParams(location.search)
const capture = params.has('capture')
const startAt = Number(params.get('t') ?? 0)

export function AdRoot() {
  const [t, setT] = useState(startAt)
  useEffect(() => {
    if (capture) {
      window.__setT = (v: number) => flushSync(() => setT(v))
      window.__adDuration = DURATION
      window.__adLines = LINES
      window.__adSfx = SFX
      window.__adMurmur = MURMUR
      void document.fonts.ready.then(() => { window.__adReady = true })
      return
    }
    const t0 = performance.now() - startAt * 1000
    const id = window.setInterval(() => setT(((performance.now() - t0) / 1000) % DURATION), 1000 / 60)
    return () => window.clearInterval(id)
  }, [])
  return <FinalPlay t={t} />
}
