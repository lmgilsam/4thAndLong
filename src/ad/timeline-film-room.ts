// Timeline for "Film Room #001: Alabama QBs": scene times, the lineup of
// silhouettes, booth lines and sound cues. Same model as timeline-turnover.ts.
//
// Text-only cut (Nov 6, 2026): times are first guesses. When the Typecast takes
// land in scripts/ad/voice-film-room/, refit the times to the real line lengths.

import type { Line } from './timeline'

export const T = {
  lightsOn: 0.25,
  hookIn: 0.55,
  hookTitle: 1.0, // "WHO'S UNDER THE HELMET?"
  hookOut: 2.6,
  boardIn: 2.5,
  fieldIn: 2.6,
  // Clue 1: played QB in the NFL. The non-QBs get flagged off.
  clue1: 3.0,
  flags1: 5.05,
  off1: 5.5,
  // Clue 2: played in the SEC.
  clue2: 7.5,
  flags2: 9.75,
  off2: 10.2,
  // Clue 3: a beat of dead silence, then Alabama.
  freeze: 11.55,
  clue3: 12.3,
  flags3: 13.75,
  off3: 14.2,
  // 4th & Long: the five left are all right answers.
  fourth: 15.8,
  regroup: 16.0,
  lit1: 18.75, // Tua
  lit2: 19.95, // Hurts
  lit3: 21.1, // Bryce Young
  darkTwo: 22.35, // the blue and yellow outlines nobody has named
  cta: 23.7,
  endCard: 25.8,
  fadeOut: 29.3,
}
export const DURATION = 29.9

export type Role = 'qb' | 'ol' | 'wr' | 'k'
export interface Suspect {
  role: Role
  row: 0 | 1 // 0 back, 1 front
  col: number // 0..5
  out: 0 | 1 | 2 | 3 // which clue sends him off (0 = never: one of the five)
  slot?: number // place in the final row of five, left to right
}

// Twelve silhouettes: four non-QBs (out on clue 1), two non-SEC QBs (clue 2),
// one SEC QB who isn't from Alabama (clue 3), and the five Alabama QBs.
export const SUSPECTS: Suspect[] = [
  { role: 'qb', row: 0, col: 0, out: 0, slot: 0 },
  { role: 'ol', row: 0, col: 1, out: 1 },
  { role: 'qb', row: 0, col: 2, out: 0, slot: 1 },
  { role: 'qb', row: 0, col: 3, out: 2 },
  { role: 'wr', row: 0, col: 4, out: 1 },
  { role: 'qb', row: 0, col: 5, out: 0, slot: 4 },
  { role: 'qb', row: 1, col: 0, out: 3 },
  { role: 'qb', row: 1, col: 1, out: 0, slot: 2 },
  { role: 'k', row: 1, col: 2, out: 1 },
  { role: 'qb', row: 1, col: 3, out: 0, slot: 3 },
  { role: 'ol', row: 1, col: 4, out: 1 },
  { role: 'qb', row: 1, col: 5, out: 2 },
]

/** The final five, left to right: three named Checkdowns, then the two nobody names. */
export const FINAL = [
  { name: 'TUA', full: 'TUA TAGOVAILOA', tier: 1 as const, at: T.lit1 },
  { name: 'HURTS', full: 'JALEN HURTS', tier: 1 as const, at: T.lit2 },
  { name: 'YOUNG', full: 'BRYCE YOUNG', tier: 1 as const, at: T.lit3 },
  { name: '?', full: '', tier: 3 as const, at: T.darkTwo },
  { name: '?', full: '', tier: 5 as const, at: T.darkTwo + 0.25 },
]

export const CLUES = [
  { n: 1, text: 'Played QB in the NFL', at: T.clue1, flags: T.flags1, off: T.off1, down: '1ST & 10' },
  { n: 2, text: 'Played in the SEC', at: T.clue2, flags: T.flags2, off: T.off2, down: '2ND & 10' },
  { n: 3, text: 'Played at Alabama', at: T.clue3, flags: T.flags3, off: T.off3, down: '3RD & 10' },
]

// Booth lines. Each shows in the chyron at `start`; a voice take saved as
// scripts/ad/voice-film-room/<id>.wav (or .mp3 / .m4a) plays at the same moment.
// Facts: Tua Tagovailoa, Jalen Hurts and Bryce Young all played QB at Alabama
// and in the NFL. All three are tier 1 (Checkdown) in prompt 'bama-qb'.
export const LINES: Line[] = [
  { id: '01-pbp-clue1', who: 'PBP', text: 'Clue one. He played quarterback in the NFL.', start: 3.15, end: 5.5, cps: 22 },
  { id: '02-color-snapper', who: 'COLOR', text: "Well, it's not the long snapper.", start: 5.55, end: 7.45, cps: 20 },
  { id: '03-pbp-clue2', who: 'PBP', text: 'Clue two. He played his college ball in the SEC.', start: 7.65, end: 10.2, cps: 22 },
  { id: '04-color-talkin', who: 'COLOR', text: "Now we're talkin'.", start: 10.25, end: T.freeze, cps: 16 },
  { id: '05-pbp-clue3', who: 'PBP', text: 'Clue three. He played at Alabama.', start: 12.35, end: 14.2, cps: 20 },
  { id: '06-color-bama', who: 'COLOR', text: 'Ohhh, a BAMA boy!', start: 14.25, end: T.fourth, cps: 16 },
  { id: '07-pbp-five', who: 'PBP', text: "Five quarterbacks left, and every one of 'em is right.", start: 16.0, end: T.lit1, cps: 24 },
  { id: '08-color-tua', who: 'COLOR', text: 'Tua? Checkdown.', start: T.lit1, end: T.lit2, cps: 16 },
  { id: '09-color-hurts', who: 'COLOR', text: 'Hurts? Checkdown.', start: T.lit2, end: T.lit3, cps: 16 },
  { id: '10-color-bryce', who: 'COLOR', text: 'Bryce Young? Checkdown.', start: T.lit3, end: T.darkTwo, cps: 18 },
  { id: '11-pbp-hailmary', who: 'PBP', text: 'Somebody out there knows the Hail Mary.', start: T.darkTwo + 0.1, end: T.endCard, cps: 20 },
  { id: '12-pbp-tag', who: 'PBP', text: 'Fourth and Long. Play free at fourth-and-long dot I-O.', start: T.endCard + 0.4, end: T.fadeOut, voiceOnly: true },
]

// Sound effects, played with the game's own sound code (src/lib/sound.ts).
export type Sfx = [number, 'cadence' | 'whistle' | 'click' | 'miss' | 'tick' | 'hit', (string | number)?]
/** Each flag lands 0.3s after it's thrown; flags in a round go 0.12s apart. */
export const FLAG_GAP = 0.12
export const FLAG_FALL = 0.3
const flagThuds = (round: 1 | 2 | 3, at: number): Sfx[] =>
  SUSPECTS.filter((s) => s.out === round).map((_, i) => [at + i * FLAG_GAP + FLAG_FALL, 'miss'] as Sfx)
export const SFX: Sfx[] = [
  [0.25, 'cadence', 'READY'], [0.42, 'cadence', 'READY'], [0.5, 'cadence', 'HUT'], // stadium lights clunk on
  [T.hookTitle, 'cadence', 'HUT!'],
  [T.clue1, 'whistle'], ...flagThuds(1, T.flags1),
  [T.clue2, 'whistle'], ...flagThuds(2, T.flags2),
  [T.clue3, 'whistle'], [T.clue3 + 0.55, 'hit', 3], ...flagThuds(3, T.flags3),
  [T.fourth, 'cadence', 'HUT!'],
  [T.lit1 + 0.05, 'hit', 1], [T.lit2 + 0.05, 'hit', 1], [T.lit3 + 0.05, 'hit', 1], // chime only: Checkdowns get no crowd
  [T.darkTwo, 'tick', 3], [T.darkTwo + 0.25, 'tick', 1],
  [T.endCard + 0.1, 'cadence', 'HUT!'],
  [T.endCard + 2.85, 'click'],
]

// Crowd murmur under everything: [time, level]. Dead silent on the freeze
// and right after each "Checkdown".
const hush = (at: number): [number, number][] => [[at + 0.4, 0.08], [at + 0.6, 0.01], [at + 1.05, 0.01], [at + 1.15, 0.08]]
export const MURMUR: [number, number][] = [
  [0, 0], [0.3, 0], [1.2, 0.07], [T.clue2, 0.08], [T.freeze - 0.05, 0.1], [T.freeze + 0.02, 0], [T.clue3 + 0.4, 0],
  [T.clue3 + 0.9, 0.12], [T.fourth, 0.09], ...hush(T.lit1), ...hush(T.lit2), ...hush(T.lit3),
  [T.cta, 0.1], [T.endCard, 0.12], [T.fadeOut - 0.8, 0.08], [DURATION - 0.1, 0],
]
