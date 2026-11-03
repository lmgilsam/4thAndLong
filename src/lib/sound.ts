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

/** A stadium crowd roar: layered filtered noise that swells and fades. */
function crowd(intensity: number, dur: number, at = 0) {
  noise({ dur, vol: 0.16 * intensity, at, freq: 1100, q: 0.6, attack: dur * 0.25 })
  noise({ dur: dur * 0.9, vol: 0.12 * intensity, at: at + 0.05, freq: 520, q: 0.7, attack: dur * 0.3 })
  noise({ dur: dur * 0.8, vol: 0.06 * intensity, at: at + 0.1, freq: 2600, q: 1.2, attack: dur * 0.2 })
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/**
 * One crowd voice: a buzzy tone through two vowel filters, so it reads as a
 * person yelling ("whoo") or booing ("ooo") rather than a synth.
 */
function voice(o: { freq: number; to: number; dur: number; vol: number; at: number; vowel: [number, number]; attack: number }) {
  const ac = audio()
  if (!ac || !master) return
  const t0 = ac.currentTime + o.at
  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(o.freq, t0)
  osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur)
  const lfo = ac.createOscillator()
  const lg = ac.createGain()
  lfo.frequency.value = rnd(4.5, 6.5)
  lg.gain.value = o.freq * 0.025
  lfo.connect(lg).connect(osc.frequency)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(o.vol, t0 + o.attack)
  g.gain.setValueAtTime(o.vol, t0 + o.dur * 0.6)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur)
  for (const [i, f] of o.vowel.entries()) {
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = f
    bp.Q.value = 5
    const fg = ac.createGain()
    fg.gain.value = i === 0 ? 1 : 0.45
    osc.connect(bp).connect(fg).connect(g)
  }
  g.connect(master)
  osc.start(t0); lfo.start(t0)
  osc.stop(t0 + o.dur + 0.05); lfo.stop(t0 + o.dur + 0.05)
}

/** Scattered hand claps. */
function claps(count: number, spread: number, at = 0, vol = 0.07) {
  for (let i = 0; i < count; i++) {
    noise({ dur: 0.035, vol: vol * rnd(0.5, 1), at: at + Math.random() * spread, freq: rnd(1200, 2200), q: 1.1, attack: 0.002 })
  }
}

/**
 * Crowd cheering. level 1 = nice play, 2 = big play, 3 = the place erupts.
 * Roar + "whoo" voices + applause, all scaled by level.
 */
function cheer(level: number, at = 0) {
  const dur = 1.3 + level * 0.7
  crowd(0.45 + level * 0.35, dur, at)
  const voices = 3 + level * 4
  for (let i = 0; i < voices; i++) {
    const f = rnd(320, 620) * (Math.random() < 0.4 ? 1.6 : 1) // mix of lower and higher voices
    voice({ freq: f, to: f * rnd(1.15, 1.45), dur: rnd(0.6, 1.1) + level * 0.2, vol: 0.018 + level * 0.006, at: at + rnd(0, 0.5), vowel: [rnd(650, 800), rnd(1100, 1300)], attack: 0.06 })
  }
  claps(10 + level * 22, dur * 0.85, at + 0.15, 0.05 + level * 0.015)
}

/** The home crowd booing: low, sagging "ooo" voices over a grumble. */
function boo(at = 0) {
  const dur = 2.4
  for (let i = 0; i < 16; i++) {
    const f = rnd(95, 175) * (Math.random() < 0.3 ? 1.5 : 1)
    voice({ freq: f, to: f * rnd(0.78, 0.9), dur: rnd(1.6, 2.3), vol: 0.055, at: at + rnd(0, 0.45), vowel: [rnd(300, 360), rnd(780, 900)], attack: rnd(0.25, 0.5) })
  }
  noise({ dur, vol: 0.15, at, freq: 420, sweepTo: 260, q: 0.7, attack: 0.4 })
  noise({ dur: dur * 0.8, vol: 0.07, at: at + 0.2, freq: 900, q: 0.8, attack: 0.5 })
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
  /** Delay of game: stadium buzzer plus a groan. */
  buzzer() {
    tone({ freq: 155, type: 'sawtooth', dur: 0.7, vol: 0.09, filter: 1400, attack: 0.01 })
    tone({ freq: 161, type: 'sawtooth', dur: 0.7, vol: 0.09, filter: 1400, attack: 0.01 })
    noise({ dur: 1.4, vol: 0.09, at: 0.25, freq: 700, sweepTo: 300, q: 0.7, attack: 0.3 })
  },
  /** Turnover on downs: a short buzzer, then the crowd boos. */
  turnover() {
    tone({ freq: 155, type: 'sawtooth', dur: 0.45, vol: 0.08, filter: 1400, attack: 0.01 })
    tone({ freq: 161, type: 'sawtooth', dur: 0.45, vol: 0.08, filter: 1400, attack: 0.01 })
    boo(0.25)
  },
  /**
   * Correct answer. Rarer tiers get more notes and a bigger crowd:
   * Slant gets a smattering of applause, Chunk Play a cheer, Deep Ball a big
   * cheer, House Call the whole stadium plus an air horn.
   */
  hit(tier: number) {
    for (let i = 0; i < tier; i++) {
      tone({ freq: CHIME[i], type: 'triangle', dur: 0.32, vol: 0.14, at: i * 0.075 })
      tone({ freq: CHIME[i] * 2, type: 'sine', dur: 0.2, vol: 0.03, at: i * 0.075 })
    }
    if (tier === 2) claps(14, 0.9, 0.1, 0.05)
    if (tier >= 3) cheer(tier - 2, 0.05)
    if (tier >= 5) airhorn(0.3, 0.7)
  },
  touchdown() {
    airhorn(0, 0.5)
    airhorn(0.6, 1.1)
    cheer(3)
    cheer(2, 1.6)
    CHIME.forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.5, vol: 0.12, at: 0.2 + i * 0.09 }))
  },
  fieldGoal() {
    tone({ freq: 140, to: 50, type: 'triangle', dur: 0.14, vol: 0.4 }) // the kick
    noise({ dur: 0.08, vol: 0.15, freq: 600, type: 'lowpass' })
    cheer(2, 0.35)
    tone({ freq: 784, type: 'triangle', dur: 0.4, vol: 0.12, at: 0.5 })
    tone({ freq: 1046.5, type: 'triangle', dur: 0.5, vol: 0.12, at: 0.62 })
  },
  punt() {
    tone({ freq: 233, to: 220, type: 'sawtooth', dur: 0.4, vol: 0.06, filter: 900 })
    tone({ freq: 220, to: 175, type: 'sawtooth', dur: 0.8, vol: 0.06, at: 0.42, filter: 900, vibrato: { rate: 5, depth: 4 } })
    noise({ dur: 1.4, vol: 0.06, freq: 600, sweepTo: 250, attack: 0.3 })
  },
}
