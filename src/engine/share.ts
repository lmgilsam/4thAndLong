// Result links: https://4thandlong.io/r/3-2222121
// The code holds the drive and one digit per play (the tier, 0 for a miss). Points, yards and
// the outcome are worked out from the tiers, so a link can only describe a drive that could happen.
// The game builds the link (Results.tsx); api/r.ts and api/card.ts read it to draw the preview.
//   daily:            "<driveNo>-<tiers>"   e.g. 3-2222121
//   practice replay:  "p<driveNo>-<tiers>"  e.g. p5-3410221
//   random practice:  "p-<tiers>"
import type { TierId } from '../data/types'
import { driveOutcome, PLAYS_PER_DRIVE, TIERS, type DriveOutcome } from './tiers'

export interface SharedResult {
  code: string
  practice: boolean
  driveNo: number // 0 for a random practice drive
  tiers: (TierId | 0)[]
  score: number
  yards: number
  outcome: DriveOutcome
}

export function encodeShare(driveNo: number, practice: boolean, results: { tier?: TierId }[]): string {
  const tiers = results.map((r) => r.tier ?? 0).join('')
  const drive = driveNo > 0 ? String(driveNo) : ''
  return `${practice ? 'p' : ''}${drive}-${tiers}`
}

export function decodeShare(raw: string | null | undefined): SharedResult | null {
  const m = /^(p?)(\d{0,5})-([0-5]{1,7})$/.exec((raw ?? '').trim().toLowerCase())
  if (!m) return null
  const practice = m[1] === 'p'
  const driveNo = m[2] ? Number(m[2]) : 0
  if (!practice && driveNo < 1) return null
  const tiers = [...m[3]].map((d) => Number(d) as TierId | 0)
  if (tiers.length > PLAYS_PER_DRIVE) return null
  const score = tiers.reduce<number>((s, t) => s + (t ? TIERS[t].points : 0), 0)
  const yards = tiers.reduce<number>((s, t) => s + (t ? TIERS[t].yards : 0), 0)
  return { code: m[0], practice, driveNo, tiers, score, yards, outcome: driveOutcome(yards) }
}

/** "DRIVE #3", "DRIVE #5 · PRACTICE" or "PRACTICE". */
export function shareLabel(r: SharedResult): string {
  if (!r.practice) return `DRIVE #${r.driveNo}`
  return r.driveNo ? `DRIVE #${r.driveNo} · PRACTICE` : 'PRACTICE'
}
