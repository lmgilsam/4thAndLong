import type { TierId } from '../data/types'

export interface PlayResult {
  promptId: string
  outcome: 'hit' | 'turnover' | 'delay'
  answerName?: string
  input?: string
  tier?: TierId
  points: number
  yards: number
  guesses: string[]
}

export interface DriveState {
  date: string
  driveNo: number
  promptIds: string[]
  results: PlayResult[]
  /** In-progress play, so a refresh can't reset the play clock. */
  current?: { index: number; startedAt: number; guesses: string[] }
  finished?: boolean
  submitted?: boolean
}

export interface Stats {
  played: number
  streak: number
  maxStreak: number
  lastDate?: string
  best: number
  touchdowns: number
  history: { date: string; score: number }[]
}

const KEY_DRIVE = 'dd:drive:'
const KEY_STATS = 'dd:stats'
const KEY_PLAYER = 'dd:player'
const KEY_SEEN_HELP = 'dd:seen-help'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: game still works for this session */
  }
}

export const loadDrive = (date: string) => read<DriveState>(KEY_DRIVE + date)
export const saveDrive = (s: DriveState) => write(KEY_DRIVE + s.date, s)

export function loadStats(): Stats {
  return read<Stats>(KEY_STATS) ?? { played: 0, streak: 0, maxStreak: 0, best: 0, touchdowns: 0, history: [] }
}

function previousDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) - 86_400_000).toISOString().slice(0, 10)
}

export function recordFinishedDrive(date: string, score: number, touchdown: boolean): Stats {
  const s = loadStats()
  if (s.history.some((h) => h.date === date)) return s
  s.streak = s.lastDate === previousDay(date) ? s.streak + 1 : 1
  s.maxStreak = Math.max(s.maxStreak, s.streak)
  s.played += 1
  s.best = Math.max(s.best, score)
  if (touchdown) s.touchdowns += 1
  s.lastDate = date
  s.history = [...s.history, { date, score }].slice(-120)
  write(KEY_STATS, s)
  return s
}

/** Current streak, which resets if yesterday was skipped. */
export function liveStreak(today: string): number {
  const s = loadStats()
  if (s.lastDate === today || s.lastDate === previousDay(today)) return s.streak
  return 0
}

export function playerId(): string {
  let id = read<string>(KEY_PLAYER)
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`
    write(KEY_PLAYER, id)
  }
  return id
}

export const hasSeenHelp = () => read<boolean>(KEY_SEEN_HELP) === true
export const markHelpSeen = () => write(KEY_SEEN_HELP, true)
