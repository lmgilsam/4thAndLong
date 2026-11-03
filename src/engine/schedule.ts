import { BATCHES, PROMPTS } from '../data/prompts'
import { TEAM_PROMPTS } from '../data/team-prompts'
import type { PromptDef } from '../data/types'
import { PLAYS_PER_DRIVE } from './tiers'

/** Day 1 of The Daily Drive. Drives reset at midnight US Central time. */
export const LAUNCH_DATE = '2026-11-03'
export const TIME_ZONE = 'America/Chicago'

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

function shuffled<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Plays each batch in its own shuffled order (batch 1 first, then batch 2...),
 * so appending a batch never changes drives that already happened. Once every
 * batch is used up, the whole pool repeats in fresh shuffles.
 * A day never contains the same prompt twice.
 */
/** From this drive on, every drive has team-specific plays. Earlier drives stay as they were. */
export const TEAM_SLOT_FROM = 5
export const TEAM_PLAYS_PER_DRIVE = 2

const teamCache: PromptDef[][] = []

/** Team plays per day, in order, never two from the same team on one day. */
function teamPromptsFor(driveNo: number): PromptDef[] {
  const target = driveNo - TEAM_SLOT_FROM
  if (teamCache[target]) return teamCache[target]
  const stream: PromptDef[] = []
  let cycle = 0
  let ptr = 0
  const deferred: PromptDef[] = []
  for (let k = 0; k <= target; k++) {
    const picks: PromptDef[] = []
    const fits = (p: PromptDef) => !picks.some((q) => q.team === p.team)
    for (let i = 0; i < deferred.length && picks.length < TEAM_PLAYS_PER_DRIVE; ) {
      if (fits(deferred[i])) picks.push(...deferred.splice(i, 1))
      else i++
    }
    while (picks.length < TEAM_PLAYS_PER_DRIVE) {
      if (ptr >= stream.length) stream.push(...shuffled(TEAM_PROMPTS, 0x7ea + cycle++ * 104729))
      const p = stream[ptr++]
      if (fits(p)) picks.push(p)
      else deferred.push(p)
    }
    teamCache[k] = picks
  }
  return teamCache[target]
}

/** A general prompt can't come back within this many days once the pool starts repeating. */
const COOLDOWN_DAYS = 5
const dayCache = new WeakMap<PromptDef[][], PromptDef[][]>()

/** General (non-team) prompts per day, simulated in order so cooldowns are respected. */
function generalDays(upTo: number, batches: PromptDef[][]): PromptDef[][] {
  const days = dayCache.get(batches) ?? []
  if (days.length >= upTo) return days
  const stream: PromptDef[] = []
  batches.forEach((batch, i) => stream.push(...shuffled(batch, 0x5eed + i * 1000)))
  const pool = batches.flat()
  let cycle = 1
  let ptr = 0
  const deferred: PromptDef[] = []
  // Replay from day 1 so results are identical no matter which day is asked for first.
  const out: PromptDef[][] = []
  for (let day = 1; day <= upTo; day++) {
    const count = day < TEAM_SLOT_FROM ? PLAYS_PER_DRIVE : PLAYS_PER_DRIVE - TEAM_PLAYS_PER_DRIVE
    const recent = new Set(out.slice(-COOLDOWN_DAYS).flat())
    const picks: PromptDef[] = []
    for (let i = 0; i < deferred.length && picks.length < count; ) {
      if (!recent.has(deferred[i]) && !picks.includes(deferred[i])) picks.push(...deferred.splice(i, 1))
      else i++
    }
    while (picks.length < count) {
      if (ptr >= stream.length) stream.push(...shuffled(pool, 0xc0ffee + cycle++ * 7919))
      const p = stream[ptr++]
      if (recent.has(p) || picks.includes(p)) deferred.push(p)
      else picks.push(p)
    }
    out.push(picks)
  }
  dayCache.set(batches, out)
  return out
}

export function promptsForDrive(driveNo: number, batches: PromptDef[][] = BATCHES): PromptDef[] {
  const general = generalDays(driveNo, batches)[driveNo - 1]
  if (driveNo < TEAM_SLOT_FROM) return [...general]
  const plays = [...general]
  // Team plays go in seeded spots, never play 1.
  const rand = mulberry32(driveNo * 31337)
  for (const t of teamPromptsFor(driveNo)) {
    const slot = 1 + Math.floor(rand() * plays.length)
    plays.splice(slot, 0, t)
  }
  return plays
}

export function randomPractice(): PromptDef[] {
  const seed = Math.floor(Math.random() * 1e9)
  const plays = shuffled(PROMPTS, seed).slice(0, PLAYS_PER_DRIVE - TEAM_PLAYS_PER_DRIVE)
  const teams = shuffled(TEAM_PROMPTS, seed + 1)
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
