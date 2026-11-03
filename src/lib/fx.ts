// Tiny event bus for full-screen effects. Components call fx.* and the
// <Effects /> layer (mounted once in App) draws them. Effects are skipped
// for players who ask their device for reduced motion.

export interface ConfettiOpts {
  colors: string[]
  count?: number
  /** Burst origin as a fraction of the viewport (0..1). */
  x?: number
  y?: number
  /** Spread angle in degrees around straight up. */
  spread?: number
  power?: number
  /** Also throw a few little footballs. */
  footballs?: boolean
}

export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function emit(name: string, detail: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

const crowdTimer = { id: 0 }

export const fx = {
  confetti(o: ConfettiOpts) {
    if (!reducedMotion()) emit('fx:confetti', o)
  },
  flash(color: string, strength = 0.3) {
    if (!reducedMotion()) emit('fx:flash', { color, strength })
  },
  /** The stadium crowd reacts on screen: cheer (level 1-3) or boo. */
  crowd(kind: 'cheer' | 'boo', level = 1, ms = 2200) {
    if (reducedMotion()) return
    const el = document.documentElement
    el.classList.remove('crowd-cheer', 'crowd-boo', 'crowd-l1', 'crowd-l2', 'crowd-l3')
    void el.offsetWidth
    el.classList.add(kind === 'cheer' ? 'crowd-cheer' : 'crowd-boo', `crowd-l${level}`)
    window.clearTimeout(crowdTimer.id)
    crowdTimer.id = window.setTimeout(() => el.classList.remove('crowd-cheer', 'crowd-boo', 'crowd-l1', 'crowd-l2', 'crowd-l3'), ms)
  },
  /** Camera shake on the whole stage. */
  quake(ms = 520) {
    if (reducedMotion()) return
    const el = document.documentElement
    el.classList.remove('quake')
    void el.offsetWidth // restart the animation
    el.classList.add('quake')
    window.setTimeout(() => el.classList.remove('quake'), ms)
  },
}
