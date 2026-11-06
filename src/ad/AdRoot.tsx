// Shared player for every ad. Each frame is a pure function of the time t
// (seconds), so the recorder can step it frame by frame: window.__setT(t)
// renders that moment. Without ?capture the scene just plays in real time,
// looping. ?t=12 starts at 12s.
import { useEffect, useState, type ComponentType } from 'react'
import { flushSync } from 'react-dom'
import type { Line } from './timeline'

/** What the recorder needs from an ad: its length, booth lines, sound cues and crowd bed. */
export interface AdTimeline {
  name: string
  duration: number
  lines: Line[]
  sfx: [number, string, (string | number)?][]
  murmur: [number, number][]
}

declare global {
  interface Window {
    __setT?: (t: number) => void
    __adReady?: boolean
    __adName?: string
    __adDuration?: number
    __adLines?: Line[]
    __adSfx?: AdTimeline['sfx']
    __adMurmur?: [number, number][]
  }
}

const params = new URLSearchParams(location.search)
const capture = params.has('capture')
const startAt = Number(params.get('t') ?? 0)

export function AdRoot({ scene: Scene, timeline }: { scene: ComponentType<{ t: number }>; timeline: AdTimeline }) {
  const [t, setT] = useState(startAt)
  useEffect(() => {
    if (capture) {
      window.__setT = (v: number) => flushSync(() => setT(v))
      window.__adName = timeline.name
      window.__adDuration = timeline.duration
      window.__adLines = timeline.lines
      window.__adSfx = timeline.sfx
      window.__adMurmur = timeline.murmur
      void document.fonts.ready.then(() => { window.__adReady = true })
      return
    }
    const t0 = performance.now() - startAt * 1000
    const id = window.setInterval(() => setT(((performance.now() - t0) / 1000) % timeline.duration), 1000 / 60)
    return () => window.clearInterval(id)
  }, [timeline])
  return <Scene t={t} />
}
