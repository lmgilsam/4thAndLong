import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { PlayResult } from '../engine/storage'
import { arrivalSent, firstRef, markArrivalSent } from './ref'

// Global stats are optional. With VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// set (Vercel env vars), results are saved and the "vs. everyone" chart turns on.
// Without them the game still runs fully; only the global comparison is hidden.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null
export const backendEnabled = Boolean(url && key)

function db(): SupabaseClient | null {
  if (!backendEnabled) return null
  if (!client) client = createClient(url!, key!, { auth: { persistSession: false } })
  return client
}

export interface Distribution {
  buckets: { bucket: number; players: number }[]
  total: number
  /** Share of today's players you beat, 0-100 */
  percentile: number
}

export async function submitDrive(opts: {
  date: string
  player: string
  score: number
  yards: number
  plays: PlayResult[]
}): Promise<void> {
  const sb = db()
  if (!sb) return
  const args = {
    p_date: opts.date,
    p_player: opts.player,
    p_score: opts.score,
    p_yards: opts.yards,
    p_plays: opts.plays.map((p) => ({
      prompt_id: p.promptId,
      answer: p.answerName ?? null,
      tier: p.tier ?? null,
      outcome: p.outcome,
      guesses: p.guesses.length,
    })),
  }
  let { error } = await sb.rpc('submit_drive', { ...args, p_ref: firstRef() })
  // Database not updated to the version with p_ref yet: save the drive without it.
  if (error && /p_ref|function/i.test(error.message)) ({ error } = await sb.rpc('submit_drive', args))
  if (error) console.warn('[daily-drive] submit failed', error.message)
}

/** Count this browser once, with the channel it first came from (null = direct). */
export async function logArrival(player: string): Promise<void> {
  const sb = db()
  if (!sb || arrivalSent()) return
  const { error } = await sb.rpc('log_arrival', { p_player: player, p_ref: firstRef() })
  if (error) console.warn('[daily-drive] arrival failed', error.message)
  else markArrivalSent()
}

export async function fetchDistribution(date: string, score: number): Promise<Distribution | null> {
  const sb = db()
  if (!sb) return null
  const { data, error } = await sb.rpc('score_distribution', { p_date: date, p_score: score })
  if (error || !data) {
    if (error) console.warn('[daily-drive] distribution failed', error.message)
    return null
  }
  const rows = data as { bucket: number; players: number; total: number; beaten: number }[]
  const total = rows[0]?.total ?? 0
  const beaten = rows[0]?.beaten ?? 0
  return {
    buckets: rows.map((r) => ({ bucket: r.bucket, players: r.players })),
    total,
    percentile: total > 1 ? Math.round((beaten / (total - 1)) * 100) : 100,
  }
}
