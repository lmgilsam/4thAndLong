import type { AnswerDef, PromptDef } from '../data/types'
import { FIRST_NAME_GROUPS, NICKNAMES } from '../data/nicknames'

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

const tokensOf = (key: string) => key.split(' ').filter((w) => w && !SUFFIXES.has(w))
const squash = (s: string) => s.replace(/ /g, '')

/** First-name forms that count as the same name ("pat" -> "patrick"). */
const FIRST_CANON = new Map<string, string>()
for (const group of FIRST_NAME_GROUPS) for (const name of group) FIRST_CANON.set(name, group[0])
const canonFirst = (w: string) => FIRST_CANON.get(w) ?? w

/** "pat mahomes" -> "patrick mahomes". Null for one-word names or when nothing changes. */
function canonKey(tokens: string[]): string | null {
  if (tokens.length < 2) return null
  const first = canonFirst(tokens[0])
  return [first, ...tokens.slice(1)].join(' ')
}

/** Rough sound-alike spelling so "Jaxon"/"Jackson" or "Kaepernick"/"Capernick" line up. */
export function soundKey(s: string): string {
  return s
    .replace(/ph/g, 'f')
    .replace(/x/g, 'ks')
    .replace(/ck/g, 'k')
    .replace(/q/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/y/g, 'i')
    .replace(/h/g, '')
    .replace(/ie|ei|ee|ea/g, 'i')
    .replace(/oo|ou/g, 'u')
    .replace(/([a-z])\1+/g, '$1')
}

/** Edit distance that also counts a swap of two neighbouring letters ("Farve") as one typo. */
export function typoDistance(a: string, b: string, cap = 99): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > cap) return cap + 1
  const rows: number[][] = []
  for (let i = 0; i <= a.length; i++) {
    rows.push(new Array(b.length + 1).fill(0))
    rows[i][0] = i
  }
  for (let j = 0; j <= b.length; j++) rows[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, rows[i - 2][j - 2] + 1)
      rows[i][j] = v
    }
  }
  return rows[a.length][b.length]
}

/**
 * Typos allowed for a word of this length: one from 5 letters, two from 9, three from 13.
 * Inside a full name a 4-letter word gets one too ("Flee Flicker", "Mike Vik"), since the
 * rest of the name already pins down who it is.
 */
function allowed(len: number, inName = false): number {
  if (inName && len === 4) return 1
  return len < 5 ? 0 : Math.floor((len - 1) / 4)
}

/**
 * Distance between what was typed and one word/name, letting a sound-alike spelling
 * count as half a typo better than its raw spelling. Returns Infinity when too far.
 */
function closeness(input: string, target: string, inName = false): number {
  const limit = allowed(target.length, inName)
  if (limit === 0) return Infinity
  const raw = typoDistance(input, target, limit + 1)
  const sound = typoDistance(soundKey(input), soundKey(target), limit + 1) + 0.5
  let d = Math.min(raw, sound)
  // Typos almost never change the first letter: "Dickerson" is not a typo of "Wilkerson".
  if (input[0] !== target[0] && soundKey(input)[0] !== soundKey(target)[0]) d += 1
  return d <= limit ? d : Infinity
}

export type MatchResult =
  | { kind: 'hit'; answer: AnswerDef }
  /** The name fits more than one answer ("Manning"): the player needs to say which. */
  | { kind: 'ambiguous'; options: AnswerDef[] }
  /** Looks like a typo of these answers (best first). Ask before counting it. */
  | { kind: 'suggest'; options: AnswerDef[] }
  | { kind: 'miss' }
  | { kind: 'empty' }

interface Key {
  key: string
  flat: string
  tokens: string[]
  answer: AnswerDef
}

interface Index {
  exact: Map<string, AnswerDef>
  flat: Map<string, Set<AnswerDef>>
  canon: Map<string, Set<AnswerDef>>
  surnames: Map<string, AnswerDef[]>
  keys: Key[]
  nicknames: { answer: AnswerDef; nick: string }[]
}

const cache = new WeakMap<PromptDef, Index>()

const NICK_BY_NAME = new Map(Object.entries(NICKNAMES).map(([name, entry]) => [normalize(name), entry]))

/** Nicknames from data/nicknames.ts that apply to this prompt, minus any two answers would share. */
function nicknamesFor(p: PromptDef, taken: Map<string, AnswerDef>): { answer: AnswerDef; nick: string }[] {
  const claims = new Map<string, { answer: AnswerDef; nick: string }[]>()
  for (const a of p.answers) {
    const seen = new Set<string>()
    for (const label of [a.name, ...a.aliases]) {
      const entry = NICK_BY_NAME.get(normalize(label))
      if (!entry) continue
      if (p.team && entry.only && !entry.only.includes(p.id)) continue
      for (const nick of entry.nicks) {
        const key = normalize(nick, p.ignore)
        if (!key || seen.has(key)) continue
        seen.add(key)
        const owner = taken.get(key)
        if (owner && owner !== a) continue
        claims.set(key, [...(claims.get(key) ?? []), { answer: a, nick }])
      }
    }
  }
  return [...claims.values()].filter((c) => c.length === 1).map((c) => c[0])
}

function addTo<K, V>(m: Map<K, Set<V>>, k: K, v: V) {
  const s = m.get(k) ?? new Set<V>()
  s.add(v)
  m.set(k, s)
}

function buildIndex(p: PromptDef): Index {
  const exact = new Map<string, AnswerDef>()
  const flat = new Map<string, Set<AnswerDef>>()
  const canon = new Map<string, Set<AnswerDef>>()
  const surnames = new Map<string, AnswerDef[]>()
  const keys: Key[] = []

  const labels: { label: string; answer: AnswerDef }[] = []
  for (const a of p.answers) for (const label of [a.name, ...a.aliases]) labels.push({ label, answer: a })

  const own = new Map<string, AnswerDef>()
  for (const { label, answer } of labels) {
    const key = normalize(label, p.ignore)
    if (key && !own.has(key)) own.set(key, answer)
  }
  const nicknames = nicknamesFor(p, own)
  for (const { answer, nick } of nicknames) labels.push({ label: nick, answer })

  for (const { label, answer } of labels) {
    const key = normalize(label, p.ignore)
    if (!key) continue
    if (!exact.has(key)) exact.set(key, answer)
    const tokens = tokensOf(key)
    const bare = tokens.join(' ')
    if (bare && bare !== key && !exact.has(bare)) exact.set(bare, answer)
    addTo(flat, squash(key), answer)
    const c = canonKey(tokens)
    if (c) addTo(canon, c, answer)
    keys.push({ key, flat: squash(bare || key), tokens, answer })
  }

  for (const a of p.answers) {
    // Surnames: the last word ("mahomes") and, for hyphenated names, the whole last name ("smith njigba").
    const nameTokens = tokensOf(normalize(a.name, p.ignore))
    if (nameTokens.length < 2) continue
    const found = [nameTokens[nameTokens.length - 1]]
    const rawLast = a.name.trim().split(/\s+/).filter((w) => !SUFFIXES.has(normalize(w))).at(-1) ?? ''
    if (rawLast.includes('-')) {
      const hy = tokensOf(normalize(rawLast))
      if (hy.length > 1 && hy.length < nameTokens.length && nameTokens.slice(-hy.length).join(' ') === hy.join(' ')) {
        found.push(hy.join(' '))
      }
    }
    for (const s of found) {
      if (s.length < 3) continue
      const list = surnames.get(s) ?? []
      if (!list.includes(a)) list.push(a)
      surnames.set(s, list)
    }
  }
  return { exact, flat, canon, surnames, keys, nicknames }
}

function indexFor(p: PromptDef): Index {
  let idx = cache.get(p)
  if (!idx) {
    idx = buildIndex(p)
    cache.set(p, idx)
  }
  return idx
}

/** Nicknames from data/nicknames.ts that this prompt accepts (for validate-data.ts). */
export function attachedNicknames(p: PromptDef) {
  return indexFor(p).nicknames
}

/** Most options a suggestion will list before it asks for a fuller name instead. */
const MAX_OPTIONS = 4

export function matchAnswer(p: PromptDef, raw: string): MatchResult {
  const input = normalize(raw, p.ignore)
  if (!input) return { kind: 'empty' }
  const idx = indexFor(p)

  // 1. Exact name, alias or nickname, with or without Jr./III.
  const tokens = tokensOf(input)
  const bare = tokens.join(' ')
  const hit = idx.exact.get(input) ?? idx.exact.get(bare)
  if (hit) return { kind: 'hit', answer: hit }

  // 2. Surname only: "Mahomes" -> Patrick Mahomes, unless two answers share it.
  const bySurname = idx.surnames.get(bare)
  if (bySurname?.length === 1) return { kind: 'hit', answer: bySurname[0] }
  if (bySurname && bySurname.length > 1) return { kind: 'ambiguous', options: bySurname }

  // 3. Only spacing differs: "fleaflicker", "ocho cinco".
  const flatInput = squash(bare || input)
  const byFlat = idx.flat.get(flatInput)
  if (byFlat?.size === 1) return { kind: 'hit', answer: [...byFlat][0] }

  // 4. Same name with another first-name form: "Pat Mahomes", "Mike Vick" (Leo's call:
  // counts right away, even though "Bobby Bell" and "Bob Bell" can be different players).
  const c = canonKey(tokens)
  const byCanon = c ? idx.canon.get(c) : undefined
  if (byCanon?.size === 1) return { kind: 'hit', answer: [...byCanon][0] }
  if (byCanon) return { kind: 'ambiguous', options: [...byCanon] }

  // 5. Typos: never counted on their own. Offer the closest answer(s) to confirm.
  if (flatInput.length < 4) return { kind: 'miss' }
  const best = new Map<AnswerDef, number>()
  const consider = (a: AnswerDef, d: number) => {
    if (d === Infinity) return
    if (d < (best.get(a) ?? Infinity)) best.set(a, d)
  }

  for (const k of idx.keys) {
    if (k.flat.length < 4) continue
    if (tokens.length >= 2 && tokens.length === k.tokens.length) {
      // Word by word, so "Tim Brown" never turns into "Jim Brown".
      let total = 0
      for (let i = 0; i < tokens.length && total !== Infinity; i++) {
        const t = tokens[i]
        const kt = k.tokens[i]
        if (t === kt || (i === 0 && canonFirst(t) === canonFirst(kt))) continue
        total += closeness(t, kt, true)
      }
      consider(k.answer, total)
    } else {
      consider(k.answer, closeness(flatInput, k.flat))
    }
  }

  // One word close to a surname: "Roethlisburger", "Gronkowsky".
  if (tokens.length === 1) {
    for (const [surname, list] of idx.surnames) {
      const d = closeness(bare, surname)
      for (const a of list) consider(a, d)
    }
  }

  if (!best.size) return { kind: 'miss' }
  const top = Math.min(...best.values())
  const options = [...best].filter(([, d]) => d === top).map(([a]) => a)
  if (options.length > MAX_OPTIONS) return { kind: 'ambiguous', options }
  return { kind: 'suggest', options }
}

/** Rarest answers first, used to show "the Hail Mary you could've had". */
export function rarestAnswers(p: PromptDef, n = 1): AnswerDef[] {
  return [...p.answers].sort((a, b) => b.tier - a.tier).slice(0, n)
}

/**
 * A short sample for the Play by Play dropdown, not the full answer list:
 * one Hail Mary (the player's own if they hit one) when the prompt has any,
 * then the rarest answers below that, Deep Balls first, for 5 total. If the
 * player's answer would sit in that sample anyway, it takes the last spot.
 */
export function boardPicks(p: PromptDef, mine?: string): AnswerDef[] {
  const own = mine ? p.answers.find((a) => a.name === mine) : undefined
  const hails = p.answers.filter((a) => a.tier === 5)
  const hail = own?.tier === 5 ? own : hails[0]
  const slots = hail ? 4 : 5
  let rest = p.answers.filter((a) => a.tier < 5).sort((a, b) => b.tier - a.tier).slice(0, slots)
  if (own && own.tier < 5 && !rest.includes(own) && rest.length === slots && own.tier >= rest[slots - 1].tier) {
    rest = [...rest.slice(0, slots - 1), own].sort((a, b) => b.tier - a.tier)
  }
  return hail ? [hail, ...rest] : rest
}

export function mostCommonAnswer(p: PromptDef): AnswerDef {
  return [...p.answers].sort((a, b) => a.tier - b.tier)[0]
}
