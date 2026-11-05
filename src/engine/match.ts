import type { AnswerDef, PromptDef } from '../data/types'

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv'])

/** Lowercase, strip accents/punctuation, collapse spaces, drop a leading "the". */
export function normalize(raw: string, ignore: string[] = []): string {
  let s = raw
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’‘`.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (s.startsWith('the ')) s = s.slice(4)
  if (ignore.length) {
    const drop = new Set(ignore.map((w) => w.toLowerCase()))
    const kept = s.split(' ').filter((w) => !drop.has(w))
    if (kept.length) s = kept.join(' ')
  }
  return s
}

function lastToken(name: string): string | null {
  const parts = name.split(' ').filter((p) => !SUFFIXES.has(p))
  if (parts.length < 2) return null
  const last = parts[parts.length - 1]
  return last.length >= 3 ? last : null
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > 2) return 99
  const prev = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

export type MatchResult =
  | { kind: 'hit'; answer: AnswerDef }
  | { kind: 'ambiguous'; options: AnswerDef[] }
  | { kind: 'miss' }
  | { kind: 'empty' }

interface Index {
  exact: Map<string, AnswerDef>
  surnames: Map<string, AnswerDef[]>
  keys: { key: string; answer: AnswerDef }[]
}

const cache = new WeakMap<PromptDef, Index>()

function buildIndex(p: PromptDef): Index {
  const exact = new Map<string, AnswerDef>()
  const surnames = new Map<string, AnswerDef[]>()
  const keys: Index['keys'] = []
  for (const a of p.answers) {
    for (const label of [a.name, ...a.aliases]) {
      const key = normalize(label, p.ignore)
      if (!key) continue
      if (!exact.has(key)) exact.set(key, a)
      keys.push({ key, answer: a })
      const bare = key.split(' ').filter((w) => !SUFFIXES.has(w)).join(' ')
      if (bare && bare !== key && !exact.has(bare)) exact.set(bare, a)
    }
    const last = lastToken(normalize(a.name, p.ignore))
    if (last) {
      const list = surnames.get(last) ?? []
      if (!list.includes(a)) list.push(a)
      surnames.set(last, list)
    }
  }
  return { exact, surnames, keys }
}

function fuzzyLimit(len: number): number {
  if (len < 5) return 0
  if (len < 9) return 1
  return 2
}

export function matchAnswer(p: PromptDef, raw: string): MatchResult {
  const input = normalize(raw, p.ignore)
  if (!input) return { kind: 'empty' }
  let idx = cache.get(p)
  if (!idx) {
    idx = buildIndex(p)
    cache.set(p, idx)
  }

  const hit = idx.exact.get(input)
  if (hit) return { kind: 'hit', answer: hit }

  // Surname only: "Mahomes" -> Patrick Mahomes, unless two answers share it.
  const bySurname = idx.surnames.get(input)
  if (bySurname?.length === 1 && !idx.exact.has(input)) return { kind: 'hit', answer: bySurname[0] }
  if (bySurname && bySurname.length > 1) return { kind: 'ambiguous', options: bySurname }

  // Typos and missing spaces ("flea flicer", "fleaflicker").
  const limit = fuzzyLimit(input.length)
  if (limit > 0) {
    const squashed = input.replace(/ /g, '')
    let best: { d: number; answer: AnswerDef } | null = null
    let tie = false
    for (const { key, answer } of idx.keys) {
      if (key.length < 4) continue
      const d = Math.min(levenshtein(input, key), levenshtein(squashed, key.replace(/ /g, '')))
      if (d > limit) continue
      if (!best || d < best.d) {
        best = { d, answer }
        tie = false
      } else if (d === best.d && best.answer !== answer) {
        tie = true
      }
    }
    if (best && !tie) return { kind: 'hit', answer: best.answer }

    // Typo in a surname: "Mahomess"
    for (const [surname, list] of idx.surnames) {
      if (list.length === 1 && levenshtein(input, surname) <= Math.min(limit, 1)) {
        return { kind: 'hit', answer: list[0] }
      }
    }
  }
  return { kind: 'miss' }
}

/** Rarest answers first, used to show "the Hail Mary you could've had". */
export function rarestAnswers(p: PromptDef, n = 1): AnswerDef[] {
  return [...p.answers].sort((a, b) => b.tier - a.tier).slice(0, n)
}

export function mostCommonAnswer(p: PromptDef): AnswerDef {
  return [...p.answers].sort((a, b) => a.tier - b.tier)[0]
}
