// Timeline for the "Turnover on Downs" ad: scene times, play clock, booth lines
// and sound cues. Same model as timeline.ts (The Final Play).
//
// Scene times are first guesses for text-only preview. When the Typecast takes
// land in scripts/ad/voice-turnover/, refit the times to the real line lengths.

import type { Line } from './timeline'

export const T = {
  lightsOn: 0.25,
  hookIn: 0.6,
  hookLine: 1.0,
  hookEasy: 1.75,
  hookOut: 2.55,
  boardIn: 2.45,
  fieldIn: 2.55,
  ready: 2.7,
  set: 3.1,
  hut: 3.5,
  cardIn: 3.75,
  // 1st down: Josh Allen
  typeAllen: 6.9,
  snap1: 7.9,
  boothA: 8.35, // "Josh Allen's never even BEEN to one!"
  boothAOut: 10.5,
  // 2nd down: Lamar Jackson
  typeLamar: 10.75,
  snap2: 11.95,
  boothB: 12.25, // "MVPs aren't RINGS!"
  boothBOut: 13.55,
  // 3rd down: Dak Prescott
  typeDak: 14.0,
  freeze: 15.65,
  snap3: 16.35,
  // Turnover
  revealOut: 18.05,
  celebrate: 18.05, // defense celebrates on the field
  boothC: 19.45, // stat pop-up and "Zero Super Bowl starts..."
  statPop: 19.7,
  endCard: 22.05,
  fadeOut: 26.2,
}
export const DURATION = 26.8

// Rapid play clock: 25 seconds squeezed into about 12. It holds still during the freeze.
const CLOCK_KEYS: [number, number][] = [
  [T.cardIn, 25], [T.boothA, 19], [T.boothAOut, 15], [T.boothB, 11], [T.boothBOut, 7], [T.freeze, 2], [T.snap3, 2],
]
export function clockAt(t: number): number {
  if (t <= CLOCK_KEYS[0][0]) return 25
  for (let i = 1; i < CLOCK_KEYS.length; i++) {
    const [t1, v1] = CLOCK_KEYS[i]
    const [t0, v0] = CLOCK_KEYS[i - 1]
    if (t <= t1) return v0 + (v1 - v0) * ((t - t0) / (t1 - t0))
  }
  return 2
}

/** When the play clock first shows `secs` (for the last-seconds ticks). */
function clockHits(secs: number): number {
  let t = T.cardIn
  while (t < T.freeze && Math.ceil(clockAt(t) - 0.001) > secs) t += 0.005
  return Math.round(t * 1000) / 1000
}

// The three wrong guesses, as typed. Facts (through Super Bowl LX, Feb 2026):
// none of them has started a Super Bowl. Allen was 2024 MVP; Lamar was MVP for
// 2019 and 2023. All three are misses for prompt 'sb-qb' in the game's matcher.
export const GUESSES = [
  { text: 'Josh Allen', type: T.typeAllen, cps: 13, snap: T.snap1 },
  { text: 'Lamar Jackson', type: T.typeLamar, cps: 13, snap: T.snap2 },
  { text: 'Dak Prescott', type: T.typeDak, cps: 8, snap: T.snap3 },
]

// Booth lines. Each one shows in the chyron at `start`; a voice take saved as
// scripts/ad/voice-turnover/<id>.wav (or .mp3 / .m4a) plays at the same moment
// when the ad is recorded. `say` is how to read it when it differs from the text.
export const LINES: Line[] = [
  { id: '01-pbp-easy', who: 'PBP', text: 'First play of the day. Easiest question on the board.', start: 3.8, end: 6.75, cps: 22 },
  { id: '02-color-free', who: 'COLOR', text: "Free yards. He's got this.", start: 6.75, end: T.boothA, cps: 18 },
  { id: '03-color-allen', who: 'COLOR', text: "Josh Allen's never even BEEN to one!", start: T.boothA + 0.05, end: T.boothAOut, cps: 22 },
  { id: '04-pbp-lamar', who: 'PBP', text: 'Lamar Jackson? Two MVPs!', start: 10.6, end: T.boothB, cps: 18 },
  { id: '05-color-rings', who: 'COLOR', text: "MVPs aren't RINGS!", start: T.boothB + 0.05, end: T.boothBOut, cps: 20 },
  { id: '06-pbp-dont', who: 'PBP', text: "Third down. Don't do it...", start: 13.65, end: T.freeze, cps: 14 },
  { id: '07-color-dak', who: 'COLOR', text: 'DAK?!', start: T.snap3 + 0.1, end: 17.35, big: true },
  { id: '08-pbp-turnover', who: 'PBP', text: 'TURNOVER ON DOWNS!', start: 17.35, end: T.boothC, big: true },
  { id: '09-color-zero', who: 'COLOR', text: "Zero Super Bowl starts between all three of 'em!", start: T.boothC + 0.05, end: T.endCard, cps: 22 },
  { id: '10-pbp-tag', who: 'PBP', text: '4th & Long. You can do better. Play free at 4thandlong.io', start: T.endCard + 0.4, end: T.fadeOut, say: 'Fourth and Long. You can do better. Play free at fourth-and-long dot I-O.', voiceOnly: true },
]

// Sound effects, played with the game's own sound code (src/lib/sound.ts) when
// the ad is recorded. Each cue is [time, sound function, argument].
export type Sfx = [number, 'cadence' | 'whistle' | 'click' | 'miss' | 'tick' | 'turnover', (string | number)?]
const typing = (from: number, chars: number, perSec: number): Sfx[] =>
  Array.from({ length: chars }, (_, i) => [from + i / perSec, 'click'] as Sfx)
export const SFX: Sfx[] = [
  [0.25, 'cadence', 'READY'], [0.42, 'cadence', 'READY'], [0.5, 'cadence', 'HUT'], // stadium lights clunk on
  [T.ready, 'cadence', 'READY'], [T.set, 'cadence', 'SET'], [T.hut, 'cadence', 'HUT!'], [T.hut + 0.1, 'whistle'],
  ...GUESSES.flatMap((g) => typing(g.type, g.text.length, g.cps)),
  [T.snap1, 'miss'],
  [T.snap2, 'miss'],
  [clockHits(5), 'tick', 5], [clockHits(4), 'tick', 4], [clockHits(3), 'tick', 3],
  [T.snap3, 'turnover'], // buzzer, then the crowd boos
  [T.endCard + 0.1, 'cadence', 'HUT!'],
  [T.endCard + 2.85, 'click'],
]

// Crowd murmur under everything: [time, level]. Dead silent during the freeze.
export const MURMUR: [number, number][] = [
  [0, 0], [0.3, 0], [1.2, 0.07], [T.snap1, 0.07], [T.snap1 + 0.3, 0.09], [T.freeze - 0.05, 0.1], [T.freeze + 0.02, 0],
  [T.snap3 + 1.2, 0], [T.snap3 + 2.2, 0.06], [T.fadeOut - 0.8, 0.08], [DURATION - 0.1, 0],
]
