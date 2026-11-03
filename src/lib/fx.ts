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

export const fx = {
  confetti(o: ConfettiOpts) {
    if (!reducedMotion()) emit('fx:confetti', o)
  },
  flash(color: string, strength = 0.3) {
    if (!reducedMotion()) emit('fx:flash', { color, strength })
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
