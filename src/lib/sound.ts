// Game sounds, synthesized live with the Web Audio API: no audio files to
// download or license. Everything is quiet by design and respects a mute
// toggle saved in localStorage (dd:sound).

const KEY = 'dd:sound'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let muted = (() => {
  try { return localStorage.getItem(KEY) === 'off' } catch { return false }
})()

const listeners = new Set<(m: boolean) => void>()

export function isMuted() { return muted }
export function setMuted(m: boolean) {
  muted = m
  try { localStorage.setItem(KEY, m ? 'off' : 'on') } catch { /* ignore */ }
  listeners.forEach((fn) => fn(m))
}
export function onMuteChange(fn: (m: boolean) => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** Lazily creates the audio graph. Browsers only allow this after a tap or click. */
function audio(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.55
      const comp = ctx.createDynamicsCompressor()
      master.connect(comp).connect(ctx.destination)
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const data = noiseBuf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

interface ToneOpts {
  freq: number
  to?: number
  type?: OscillatorType
  dur: number
  vol?: number
  at?: number
  attack?: number
  vibrato?: { rate: number; depth: number }
  filter?: number
}

function tone(o: ToneOpts) {
  const ac = audio()
  if (!ac || !master) return
  const t0 = ac.currentTime + (o.at ?? 0)
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur)
  if (o.vibrato) {
    const lfo = ac.createOscillator()
    const lg = ac.createGain()
    lfo.frequency.value = o.vibrato.rate
    lg.gain.value = o.vibrato.depth
    lfo.connect(lg).connect(osc.frequency)
    lfo.start(t0)
    lfo.stop(t0 + o.dur + 0.05)
  }
  const vol = o.vol ?? 0.2
  const atk = o.attack ?? 0.008
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur)
  let node: AudioNode = osc
  if (o.filter) {
    const f = ac.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = o.filter
    node = osc.connect(f)
  }
  node.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + o.dur + 0.05)
}

interface NoiseOpts {
  dur: number
  vol?: number
  at?: number
  freq?: number
  q?: number
  type?: BiquadFilterType
  attack?: number
  sweepTo?: number
}

function noise(o: NoiseOpts) {
  const ac = audio()
  if (!ac || !master || !noiseBuf) return
  const t0 = ac.currentTime + (o.at ?? 0)
  const src = ac.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const f = ac.createBiquadFilter()
  f.type = o.type ?? 'bandpass'
  f.frequency.setValueAtTime(o.freq ?? 1000, t0)
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t0 + o.dur)
  f.Q.value = o.q ?? 0.8
  const g = ac.createGain()
  const vol = o.vol ?? 0.2
  const atk = o.attack ?? 0.01
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur)
  src.connect(f).connect(g).connect(master)
  src.start(t0, Math.random())
  src.stop(t0 + o.dur + 0.05)
}

/** A stadium crowd: layered filtered noise that swells and fades. */
function crowd(intensity: number, dur: number, at = 0) {
  noise({ dur, vol: 0.16 * intensity, at, freq: 1100, q: 0.6, attack: dur * 0.25 })
  noise({ dur: dur * 0.9, vol: 0.12 * intensity, at: at + 0.05, freq: 520, q: 0.7, attack: dur * 0.3 })
  noise({ dur: dur * 0.8, vol: 0.06 * intensity, at: at + 0.1, freq: 2600, q: 1.2, attack: dur * 0.2 })
}

function airhorn(at = 0, dur = 0.9) {
  for (const f of [233, 294, 349]) tone({ freq: f, type: 'sawtooth', dur, vol: 0.07, at, attack: 0.03, filter: 1800 })
}

// Pentatonic notes for the "gain" chime: one more note per tier.
const CHIME = [523.25, 659.25, 783.99, 1046.5, 1318.5]

export const sound = {
  click() {
    tone({ freq: 1800, to: 1200, dur: 0.04, vol: 0.05, type: 'triangle' })
  },
  /** Pre-snap cadence: READY, SET, HUT! */
  cadence(word: string) {
    const hut = word.startsWith('HUT')
    tone({ freq: hut ? 150 : 110, to: hut ? 60 : 70, type: 'triangle', dur: hut ? 0.22 : 0.14, vol: hut ? 0.35 : 0.18 })
    if (hut) noise({ dur: 0.12, vol: 0.12, freq: 300, type: 'lowpass' })
  },
  /** Referee whistle at the snap. */
  whistle() {
    tone({ freq: 2900, type: 'sine', dur: 0.32, vol: 0.12, attack: 0.02, vibrato: { rate: 34, depth: 160 } })
    noise({ dur: 0.3, vol: 0.04, freq: 2900, q: 4, attack: 0.02 })
  },
  /** Last five seconds of the play clock. */
  tick(secs: number) {
    tone({ freq: secs <= 2 ? 1320 : 990, type: 'square', dur: 0.05, vol: 0.05, filter: 3000 })
  },
  /** Wrong answer: a low thud. */
  miss() {
    tone({ freq: 150, to: 70, type: 'square', dur: 0.22, vol: 0.12, filter: 900 })
    noise({ dur: 0.14, vol: 0.1, freq: 200, type: 'lowpass' })
  },
  /** Delay of game / turnover: stadium buzzer plus a groan. */
  buzzer() {
    tone({ freq: 155, type: 'sawtooth', dur: 0.7, vol: 0.09, filter: 1400, attack: 0.01 })
    tone({ freq: 161, type: 'sawtooth', dur: 0.7, vol: 0.09, filter: 1400, attack: 0.01 })
    noise({ dur: 1.4, vol: 0.09, at: 0.25, freq: 700, sweepTo: 300, q: 0.7, attack: 0.3 })
  },
  /** Correct answer. Rarer tiers get more notes and a louder crowd. */
  hit(tier: number) {
    for (let i = 0; i < tier; i++) {
      tone({ freq: CHIME[i], type: 'triangle', dur: 0.32, vol: 0.14, at: i * 0.075 })
      tone({ freq: CHIME[i] * 2, type: 'sine', dur: 0.2, vol: 0.03, at: i * 0.075 })
    }
    if (tier >= 2) crowd(0.35 + tier * 0.18, 0.9 + tier * 0.35, 0.05)
    if (tier >= 5) airhorn(0.3, 0.7)
  },
  touchdown() {
    airhorn(0, 0.5)
    airhorn(0.6, 1.1)
    crowd(1.4, 3.6)
    CHIME.forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.5, vol: 0.12, at: 0.2 + i * 0.09 }))
  },
  fieldGoal() {
    tone({ freq: 140, to: 50, type: 'triangle', dur: 0.14, vol: 0.4 }) // the kick
    noise({ dur: 0.08, vol: 0.15, freq: 600, type: 'lowpass' })
    crowd(0.9, 2.2, 0.35)
    tone({ freq: 784, type: 'triangle', dur: 0.4, vol: 0.12, at: 0.5 })
    tone({ freq: 1046.5, type: 'triangle', dur: 0.5, vol: 0.12, at: 0.62 })
  },
  punt() {
    tone({ freq: 233, to: 220, type: 'sawtooth', dur: 0.4, vol: 0.06, filter: 900 })
    tone({ freq: 220, to: 175, type: 'sawtooth', dur: 0.8, vol: 0.06, at: 0.42, filter: 900, vibrato: { rate: 5, depth: 4 } })
    noise({ dur: 1.4, vol: 0.06, freq: 600, sweepTo: 250, attack: 0.3 })
  },
}
