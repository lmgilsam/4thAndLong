import type { AnswerDef, PromptDef, TierId } from './types'
import index from './team-index.json'

// "Name a QB / RB / defensive player / WR or TE who has played for <team>" prompts.
// Built by scripts/build_team_data.py from nflverse roster data. The answer
// lists are large, so each one lives in public/teams/ and loads on demand.

interface TeamIndexEntry {
  id: string
  team: string
  group: 'qb' | 'rb' | 'def' | 'rec'
  teamName: string
  text: string
  file: string
  count: number
  /** Groups added after launch go live on this date (YYYY-MM-DD, US Central) */
  from?: string
}

const SHORT: Record<string, string> = {
  ARI: 'Cardinals', ATL: 'Falcons', BAL: 'Ravens', BUF: 'Bills', CAR: 'Panthers', CHI: 'Bears', CIN: 'Bengals',
  CLE: 'Browns', DAL: 'Cowboys', DEN: 'Broncos', DET: 'Lions', GB: 'Packers', HOU: 'Texans', IND: 'Colts',
  JAX: 'Jaguars', KC: 'Chiefs', LV: 'Raiders', LAC: 'Chargers', LAR: 'Rams', MIA: 'Dolphins', MIN: 'Vikings',
  NE: 'Patriots', NO: 'Saints', NYG: 'Giants', NYJ: 'Jets', PHI: 'Eagles', PIT: 'Steelers', SF: '49ers',
  SEA: 'Seahawks', TB: 'Buccaneers', TEN: 'Titans', WAS: 'Washington',
}

export const TEAM_PROMPTS: PromptDef[] = (index as TeamIndexEntry[]).map((e) => ({
  id: e.id,
  tag: SHORT[e.team] ?? e.team,
  text: e.text,
  answers: [],
  src: e.file,
  team: e.team,
  from: e.from,
}))

const loading = new Map<string, Promise<void>>()

/** Fetches a team prompt's answer list (no-op for regular prompts or once loaded). */
export function ensureAnswers(p: PromptDef): Promise<void> {
  if (!p.src || p.answers.length) return Promise.resolve()
  let pending = loading.get(p.id)
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}${p.src}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<{ tiers: Record<string, string[]> }>
      })
      .then((data) => {
        const answers: AnswerDef[] = []
        for (const [tier, names] of Object.entries(data.tiers)) {
          for (const name of names) answers.push({ name, aliases: [], tier: Number(tier) as TierId })
        }
        p.answers = answers
      })
      .catch((err) => {
        loading.delete(p.id)
        throw err
      })
    loading.set(p.id, pending)
  }
  return pending
}
