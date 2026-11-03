import { PROMPTS } from '../data/prompts'
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
 * Walks through the prompt pool in shuffled cycles so no prompt repeats until
 * the whole pool has been used. A day never contains the same prompt twice.
 */
export function promptsForDrive(driveNo: number, pool: PromptDef[] = PROMPTS): PromptDef[] {
  const needed = driveNo * PLAYS_PER_DRIVE
  const seq: PromptDef[] = []
  for (let cycle = 0; seq.length < needed + PLAYS_PER_DRIVE; cycle++) {
    seq.push(...shuffled(pool, 0x5eed + cycle * 7919))
  }
  const start = (driveNo - 1) * PLAYS_PER_DRIVE
  const picked: PromptDef[] = []
  for (let i = start; picked.length < PLAYS_PER_DRIVE && i < seq.length; i++) {
    if (!picked.includes(seq[i])) picked.push(seq[i])
  }
  return picked
}

export function randomPractice(): PromptDef[] {
  return shuffled(PROMPTS, Math.floor(Math.random() * 1e9)).slice(0, PLAYS_PER_DRIVE)
}

export function getPrompt(id: string): PromptDef | undefined {
  return PROMPTS.find((p) => p.id === id)
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
