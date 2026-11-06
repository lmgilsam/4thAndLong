// Timeline for the Final Play ad: scene times, play clock and booth lines.

export const DURATION = 23

// ---------- Timeline (seconds) ----------
export const T = {
  lightsOn: 0.25,
  hookIn: 0.6,
  hookOut: 1.9,
  boardIn: 1.8,
  fieldIn: 2.0,
  ready: 2.15,
  set: 2.55,
  hut: 2.95,
  cardIn: 3.2,
  boothIn: 5.0,
  bradyPop: 5.6,
  boothOut: 8.0,
  typeBrady: 8.25,
  boothNo: 9.3,
  boothNoOut: 9.75,
  deleteBrady: 9.75,
  typeHoss: 10.6,
  snap: 11.95,
  freeze: 12.0,
  reveal: 13.0,
  throwSnap: 14.3,
  release: 14.8,
  catch: 15.5,
  endCard: 18.2,
  fadeOut: 22.4,
}

// Rapid play clock: the ad squeezes 25 seconds into about 9.
const CLOCK_KEYS: [number, number][] = [[3.2, 25], [5.0, 20], [8.0, 10], [9.5, 6], [12.0, 2]]
export function clockAt(t: number): number {
  if (t <= CLOCK_KEYS[0][0]) return 25
  for (let i = 1; i < CLOCK_KEYS.length; i++) {
    const [t1, v1] = CLOCK_KEYS[i]
    const [t0, v0] = CLOCK_KEYS[i - 1]
    if (t <= t1) return v0 + (v1 - v0) * ((t - t0) / (t1 - t0))
  }
  return 2
}

// Booth lines. Each one shows on screen in the chyron at `start`, and a voice
// take saved as scripts/ad/voice/<id>.wav (or .mp3 / .m4a) plays at the same
// moment when the ad is recorded (scripts/ad/record-ad.cjs). `say` is how the
// line should be read aloud when it differs from the on-screen text.
// `voiceOnly` lines have no chyron (the end card tag).
export interface Line {
  id: string
  who: 'PBP' | 'COLOR'
  text: string
  start: number
  end: number
  big?: boolean
  cps?: number
  say?: string
  voiceOnly?: boolean
}
export const LINES: Line[] = [
  { id: '01-pbp-bag', who: 'PBP', text: "Field goal's already in the bag. They want six.", start: 3.3, end: 5.0 },
  { id: '02-color-brady', who: 'COLOR', text: "Do NOT say Brady. Brady's a checkdown. One yard.", start: 5.15, end: 8.0 },
  { id: '03-pbp-thinking', who: 'PBP', text: "Oh, he's thinking about it...", start: 8.3, end: 9.3 },
  { id: '04-color-no', who: 'COLOR', text: 'NO!', start: 9.3, end: 10.4, big: true },
  { id: '05-pbp-hostetler', who: 'PBP', text: '...Hostetler?', start: 12.1, end: 13.0, cps: 14 },
  { id: '06-pbp-hail-mary', who: 'PBP', text: 'HAIL MARY!', start: 13.0, end: 15.5, big: true },
  { id: '07-pbp-touchdown', who: 'PBP', text: 'TOUCHDOWN!', start: 15.5, end: 16.15, big: true },
  { id: '08-color-xxv', who: 'COLOR', text: 'Super Bowl XXV! WHO SAYS HOSTETLER?!', start: 16.15, end: 18.2, cps: 40, say: 'Super Bowl twenty-five! WHO SAYS HOSTETLER?!' },
  { id: '09-pbp-tag', who: 'PBP', text: '4th & Long. Play free at 4thandlong.io', start: 19.6, end: 22.4, say: 'Fourth and Long. Play free at fourth-and-long dot I-O.', voiceOnly: true },
]

// Sound effects, played with the game's own sound code (src/lib/sound.ts) when
// the ad is recorded. Each cue is [time, sound function, argument].
export type Sfx = [number, 'cadence' | 'whistle' | 'hit' | 'click' | 'miss' | 'tick' | 'touchdown', (string | number)?]
const typing = (from: number, chars: number, perSec: number): Sfx[] =>
  Array.from({ length: chars }, (_, i) => [from + i / perSec, 'click'] as Sfx)
export const SFX: Sfx[] = [
  [0.25, 'cadence', 'READY'], [0.42, 'cadence', 'READY'], [0.5, 'cadence', 'HUT'], // stadium lights clunk on
  [T.ready, 'cadence', 'READY'], [T.set, 'cadence', 'SET'], [T.hut, 'cadence', 'HUT!'], [T.hut + 0.1, 'whistle'],
  [T.bradyPop, 'hit', 1], // Brady = Checkdown: chime only, no crowd
  ...typing(T.typeBrady, 6, 10),
  [T.boothNo, 'miss'],
  ...typing(T.deleteBrady, 6, 20),
  ...typing(T.typeHoss, 14, 13),
  [10.125, 'tick', 5], [10.75, 'tick', 4], [11.375, 'tick', 3], // when the clock shows 5, 4, 3
  [T.snap, 'cadence', 'HUT'],
  [T.reveal, 'hit', 5], // Hail Mary: chimes, the real crowd recording, air horn
  [T.throwSnap, 'cadence', 'HUT!'], [T.throwSnap + 0.02, 'whistle'],
  [T.catch, 'touchdown'],
  [T.endCard + 0.1, 'cadence', 'HUT!'],
  [21.05, 'click'],
]

// Crowd murmur under everything: [time, level]. Dead silent during the freeze.
export const MURMUR: [number, number][] = [
  [0, 0], [0.3, 0], [1.2, 0.07], [9.6, 0.07], [11.9, 0.11], [T.freeze + 0.02, 0],
  [T.reveal - 0.05, 0], [T.reveal + 0.2, 0.13], [21.6, 0.13], [22.9, 0],
]
