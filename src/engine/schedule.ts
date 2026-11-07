import { BATCHES, PROMPTS } from '../data/prompts'
import { TEAM_PROMPTS } from '../data/team-prompts'
import type { PromptDef } from '../data/types'
import { PLAYS_PER_DRIVE } from './tiers'

/** Day 1 of The Daily Drive. Drives reset at midnight US Central time. */
export const LAUNCH_DATE = '2026-11-03'
export const TIME_ZONE = 'America/Chicago'

/** From this drive on, every drive has team-specific plays. Earlier drives stay as they were. */
export const TEAM_SLOT_FROM = 5
export const TEAM_PLAYS_PER_DRIVE = 2

/** A prompt used in a drive can't come back until this many days later. */
export const COOLDOWN_DAYS = 7
/** Live general prompts needed for the cooldown to always hold (5 general plays a day). */
export const MIN_GENERAL_POOL = COOLDOWN_DAYS * (PLAYS_PER_DRIVE - TEAM_PLAYS_PER_DRIVE)
/** Batches 1 and 2 shipped before go-live dates existed, so they count as live from launch. */
const DATELESS_BATCHES = 2

export function todayKey(now = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

function utcDay(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function dayIndex(dateKey: string): number {
  return Math.round((utcDay(dateKey) - utcDay(LAUNCH_DATE)) / 86_400_000)
}

export function dateForDrive(driveNo: number): string {
  return new Date(utcDay(LAUNCH_DATE) + (driveNo - 1) * 86_400_000).toISOString().slice(0, 10)
}

export function driveNumber(dateKey: string): number {
  return Math.max(1, dayIndex(dateKey) + 1)
}

// Small deterministic PRNG so every player gets the same prompts.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable 0..1 number for a string. Depends only on the string, never on the pool. */
function hash01(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return mulberry32(h ^ 0x5eed)()
}

function shuffled<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

interface Entry {
  p: PromptDef
  /** First drive this prompt may appear in, or null if it has no go-live date. */
  live: number | null
  /** Order brand-new prompts debut in (earlier batches first). */
  debut: number
}

const liveFromDate = (p: PromptDef) => (p.from ? Math.max(1, dayIndex(p.from) + 1) : null)

/** General prompts: each batch keeps its own shuffled debut order (seed 0x5eed + 1000 x batch). */
function generalEntries(batches: PromptDef[][]): Entry[] {
  return batches.flatMap((batch, bi) =>
    shuffled(batch, 0x5eed + bi * 1000).map((p, i) => ({
      p,
      live: liveFromDate(p) ?? (bi < DATELESS_BATCHES ? 1 : null),
      debut: bi * 100_000 + i,
    })))
}

/**
 * Team prompts come in waves: the launch set (QB/RB/defense, no go-live date) and
 * groups added later (WR/TE from Nov 8, 2026). Each wave keeps its own shuffle
 * (seed 0x7ea + 1000 x wave), so the launch set's order never changes. Debut order
 * is each prompt's position within its wave from 0 to 1, so a later wave mixes in
 * evenly with the launch prompts still unused instead of waiting behind all of them.
 */
function teamEntries(): Entry[] {
  const waves = new Map<string, PromptDef[]>()
  for (const p of TEAM_PROMPTS) {
    const key = p.from ?? ''
    waves.set(key, [...(waves.get(key) ?? []), p])
  }
  return [...waves.keys()].sort().flatMap((key, wi) => {
    const wave = shuffled(waves.get(key)!, 0x7ea + wi * 1000)
    return wave.map((p, i) => ({ p, live: liveFromDate(p) ?? 1, debut: (i + (wi ? 0.5 : 0)) / wave.length }))
  })
}

/** Team prompts already live on a given drive (practice must not show future ones). */
function liveTeamPrompts(driveNo: number): PromptDef[] {
  return TEAM_PROMPTS.filter((p) => (liveFromDate(p) ?? 1) <= driveNo)
}

interface Lane { entries: Entry[]; days: PromptDef[][]; lastUsed: Map<string, number> }

const newLane = (entries: Entry[]): Lane => ({ entries, days: [], lastUsed: new Map() })

/**
 * Fills a lane one day at a time, in order:
 *  1. Prompts never used before go first (new batches debut right away).
 *  2. Then prompts that have rested at least COOLDOWN_DAYS, oldest first, with
 *     a little seeded jitter so the same prompts don't always travel together.
 *  3. Only if the pool is too small does it fall back to the longest-rested ones.
 * A day depends only on the days before it and on prompts already live, so a
 * batch with a future go-live date never changes earlier drives.
 */
function fill(l: Lane, upTo: number, countFor: (d: number) => number, fits: (picks: PromptDef[], p: PromptDef) => boolean) {
  for (let d = l.days.length + 1; d <= upTo; d++) {
    const count = countFor(d)
    if (count === 0) { l.days.push([]); continue }
    const last = (p: PromptDef) => l.lastUsed.get(p.id)
    const live = l.entries.filter((e) => e.live !== null && e.live <= d)
    const fresh = live.filter((e) => last(e.p) === undefined).sort((a, b) => a.debut - b.debut).map((e) => e.p)
    const used = live.filter((e) => last(e.p) !== undefined).map((e) => e.p)
    const jitter = (p: PromptDef) => last(p)! + hash01(`${p.id}#${d}`) * COOLDOWN_DAYS
    const rested = used.filter((p) => d - last(p)! >= COOLDOWN_DAYS).sort((a, b) => jitter(a) - jitter(b))
    const tired = used
      .filter((p) => d - last(p)! < COOLDOWN_DAYS)
      .sort((a, b) => last(a)! - last(b)! || hash01(`${a.id}#${d}`) - hash01(`${b.id}#${d}`))

    const picks: PromptDef[] = []
    for (const p of [...fresh, ...rested, ...tired]) {
      if (picks.length >= count) break
      if (fits(picks, p)) picks.push(p)
    }
    picks.forEach((p) => l.lastUsed.set(p.id, d))
    l.days.push(picks)
  }
  return l.days
}

const generalCount = (d: number) => (d < TEAM_SLOT_FROM ? PLAYS_PER_DRIVE : PLAYS_PER_DRIVE - TEAM_PLAYS_PER_DRIVE)
const teamCount = (d: number) => (d < TEAM_SLOT_FROM ? 0 : TEAM_PLAYS_PER_DRIVE)
const anyFits = () => true
/** Never two plays about the same team on one day. */
const teamFits = (picks: PromptDef[], p: PromptDef) => !picks.some((q) => q.team === p.team)

const generalLanes = new WeakMap<PromptDef[][], Lane>()
const teamLane = { current: null as Lane | null }

function generalLane(batches: PromptDef[][]): Lane {
  let l = generalLanes.get(batches)
  if (!l) { l = newLane(generalEntries(batches)); generalLanes.set(batches, l) }
  return l
}

/** The general and team prompts for one drive, before they're interleaved. */
export function lanesForDrive(driveNo: number, batches: PromptDef[][] = BATCHES) {
  const d = Math.max(1, driveNo)
  const general = fill(generalLane(batches), d, generalCount, anyFits)[d - 1]
  teamLane.current ??= newLane(teamEntries())
  const team = fill(teamLane.current, d, teamCount, teamFits)[d - 1]
  return { general, team }
}

/** The 7 prompts for a given drive number. Same for every player. */
export function promptsForDrive(driveNo: number, batches: PromptDef[][] = BATCHES): PromptDef[] {
  const { general, team } = lanesForDrive(driveNo, batches)
  const plays = [...general]
  // Team plays go in seeded spots, never play 1.
  const rand = mulberry32(Math.max(1, driveNo) * 31337)
  for (const t of team) {
    const slot = 1 + Math.floor(rand() * plays.length)
    plays.splice(slot, 0, t)
  }
  return plays
}

/** First drive a general prompt may appear in: null = no go-live date (never scheduled). */
export function liveDriveOf(id: string, batches: PromptDef[][] = BATCHES): number | null | undefined {
  return generalLane(batches).entries.find((e) => e.p.id === id)?.live
}

/** Random practice drive drawn only from prompts already live, so practice never spoils future days. */
export function randomPractice(): PromptDef[] {
  const today = driveNumber(todayKey())
  const seed = Math.floor(Math.random() * 1e9)
  const live = PROMPTS.filter((p) => {
    const from = liveDriveOf(p.id)
    return from != null && from <= today
  })
  const plays = shuffled(live, seed).slice(0, PLAYS_PER_DRIVE - TEAM_PLAYS_PER_DRIVE)
  const teams = shuffled(liveTeamPrompts(today), seed + 1)
  const picked = [teams[0], teams.find((t) => t.team !== teams[0].team)!]
  picked.forEach((t, i) => plays.splice(1 + ((seed >> (i * 3)) % plays.length), 0, t))
  return plays
}

export function getPrompt(id: string): PromptDef | undefined {
  return PROMPTS.find((p) => p.id === id) ?? TEAM_PROMPTS.find((p) => p.id === id)
}

/** Milliseconds until the next drive unlocks (midnight Central). */
export function msUntilNextDrive(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(now)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  const elapsed = ((get('hour') % 24) * 3600 + get('minute') * 60 + get('second')) * 1000
  return 86_400_000 - elapsed
}
