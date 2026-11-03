import type { TierId } from '../data/types'

export interface TierMeta {
  id: TierId
  name: string
  points: number
  yards: number
  color: string
  blurb: string
  emoji: string
}

// Points convert to yards at 10 pts = 1 yd. The drive starts at midfield,
// so 500 points (50 yards) is a touchdown.
export const TIERS: Record<TierId, TierMeta> = {
  1: { id: 1, name: 'Checkdown', points: 10, yards: 1, color: '#b9c4bd', emoji: '⬜', blurb: 'Safe throw. Everybody had that one.' },
  2: { id: 2, name: 'Slant', points: 30, yards: 3, color: '#5ccfe6', emoji: '🟦', blurb: 'Quick hitter. Moves the chains a little.' },
  3: { id: 3, name: 'Chunk Play', points: 60, yards: 6, color: '#8be36b', emoji: '🟩', blurb: "Nice gain. Plenty of people didn't see it." },
  4: { id: 4, name: 'Deep Ball', points: 80, yards: 8, color: '#ffc845', emoji: '🟨', blurb: 'Dropped it in the bucket. Few go there.' },
  5: { id: 5, name: 'House Call', points: 100, yards: 10, color: '#ff5a5f', emoji: '🟥', blurb: 'Took it the distance. Almost nobody had that.' },
}

export const MISS = {
  turnover: { name: 'Turnover on Downs', blurb: 'Three downs, no gain.', emoji: '⬛' },
  delay: { name: 'Delay of Game', blurb: 'The play clock beat you.', emoji: '⬛' },
}

export const PLAYS_PER_DRIVE = 7
export const PLAY_CLOCK_SECONDS = 25
export const DOWNS_PER_PLAY = 3
export const START_YARD_LINE = 50 // midfield
export const MAX_SCORE = PLAYS_PER_DRIVE * 100

export type DriveOutcome =
  | { kind: 'td'; label: string; detail: string }
  | { kind: 'fg'; label: string; detail: string }
  | { kind: 'punt'; label: string; detail: string }

/** Field position label, e.g. "OPP 23" or "50". yardsGained counts from midfield. */
export function ballOn(yardsGained: number): string {
  const toGoal = START_YARD_LINE - yardsGained
  if (toGoal <= 0) return 'END ZONE'
  if (toGoal === 50) return '50'
  return toGoal < 50 ? `OPP ${toGoal}` : `OWN ${100 - toGoal}`
}

export function driveOutcome(yards: number): DriveOutcome {
  const toGoal = START_YARD_LINE - yards
  if (toGoal <= 0) return { kind: 'td', label: 'Touchdown', detail: 'You punched it in. Six points.' }
  if (toGoal <= 35) {
    const fg = toGoal + 17
    return { kind: 'fg', label: 'Field Goal', detail: `Drive stalled at the ${toGoal}. ${fg}-yard try is good.` }
  }
  return { kind: 'punt', label: 'Punt', detail: `Drive stalled at the ${toGoal}. Bring out the punter.` }
}
