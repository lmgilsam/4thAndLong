import { PROMPTS } from '../src/data/prompts'
import { normalize, matchAnswer } from '../src/engine/match'
import { BATCHES } from '../src/data/prompts'
import { TEAM_PROMPTS } from '../src/data/team-prompts'
import {
  COOLDOWN_DAYS, LAUNCH_DATE, MIN_GENERAL_POOL,
  dateForDrive, driveNumber, liveDriveOf, promptsForDrive, todayKey,
} from '../src/engine/schedule'
import { readLock } from './schedule-tools'

let problems = 0
const ids = new Set<string>()
for (const p of PROMPTS) {
  if (ids.has(p.id)) { console.log('DUP PROMPT ID', p.id); problems++ }
  ids.add(p.id)
  const names = new Set<string>()
  const keyOwner = new Map<string, string>()
  for (const a of p.answers) {
    const nk = normalize(a.name, p.ignore)
    if (names.has(nk)) { console.log(`[${p.id}] duplicate answer: ${a.name}`); problems++ }
    names.add(nk)
    for (const l of [a.name, ...a.aliases]) {
      const k = normalize(l, p.ignore)
      const owner = keyOwner.get(k)
      if (owner && owner !== a.name) { console.log(`[${p.id}] alias "${l}" used by both ${owner} and ${a.name}`); problems++ }
      keyOwner.set(k, a.name)
    }
    // every name and alias must match back to itself
    for (const l of [a.name, ...a.aliases]) {
      const r = matchAnswer(p, l)
      if (r.kind !== 'hit' || r.answer !== a) { console.log(`[${p.id}] "${l}" -> ${r.kind === 'hit' ? r.answer.name : r.kind}`); problems++ }
    }
  }
  const tiers = [1,2,3,4,5].map(t => p.answers.filter(a => a.tier === t).length)
  console.log(`${p.id.padEnd(20)} ${String(p.answers.length).padStart(3)} answers  tiers ${tiers.join('/')}`)
}

// ---- Schedule checks ----
const today = driveNumber(todayKey())
for (const p of PROMPTS) {
  if (p.from && !/^\d{4}-\d{2}-\d{2}$/.test(p.from)) { console.log(`[${p.id}] bad from date "${p.from}" (use YYYY-MM-DD)`); problems++; continue }
  if (p.from && p.from <= LAUNCH_DATE) { console.log(`[${p.id}] from ${p.from} must be after launch (${LAUNCH_DATE})`); problems++ }
  if (liveDriveOf(p.id) === null) { console.log(`[${p.id}] has no go-live date. Add its batch as liveFrom('YYYY-MM-DD', BATCH_N) in BATCHES`); problems++ }
}

const lock = readLock()
const lockedDays = Object.keys(lock).map(Number).sort((a, b) => a - b)
const lockedIds = new Set(Object.values(lock).flat())
const allIds = new Set([...PROMPTS, ...TEAM_PROMPTS].map((p) => p.id))
for (const id of lockedIds) {
  if (!allIds.has(id)) {
    console.log(`Prompt "${id}" was played but is gone. Removing played prompts changes past drives; put it back.`); problems++
  }
}
for (const d of lockedDays) {
  if (d > today) continue
  const now = promptsForDrive(d).map((p) => p.id)
  if (now.join(',') !== lock[d].join(',')) {
    console.log(`Drive #${d} (${dateForDrive(d)}) changed! was [${lock[d].join(', ')}] now [${now.join(', ')}]`)
    problems++
  }
}
const lockedThrough = lockedDays.at(-1) ?? 0
if (lockedThrough < today) console.log(`NOTE: lock covers through Drive #${lockedThrough}; today is #${today}. Run: npx tsx scripts/lock-schedule.ts`)

// Pool health: when does the 7-day no-repeat rule first break (general or team plays)?
const HORIZON = 60
let firstRepeat: string | null = null
const seen = new Map<string, number>()
for (let d = 1; d <= today + HORIZON; d++) {
  for (const p of promptsForDrive(d)) {
    const last = seen.get(p.id)
    if (!firstRepeat && d > today && last !== undefined && d - last < COOLDOWN_DAYS) {
      firstRepeat = `Drive #${d} (${dateForDrive(d)}) repeats "${p.id}" after ${d - last} days`
    }
    seen.set(p.id, d)
  }
}
const liveSoon = BATCHES.flat().filter((p) => (liveDriveOf(p.id) ?? Infinity) <= today + HORIZON).length
console.log(`\nSchedule: ${liveSoon} general prompts live within ${HORIZON} days; the ${COOLDOWN_DAYS}-day rule needs ${MIN_GENERAL_POOL}.`)
console.log(firstRepeat ? `WARNING: ${firstRepeat}. Add prompts before then.` : `No prompt repeats inside ${COOLDOWN_DAYS} days for the next ${HORIZON} days.`)
for (let d = Math.max(1, today - 1); d <= today + 7; d++) {
  console.log(`${d === today ? '>' : ' '} Drive ${String(d).padStart(3)} ${dateForDrive(d)}  ${promptsForDrive(d).map(p => p.id).join(', ')}`)
}
console.log('\nPrompts:', PROMPTS.length, 'Problems:', problems)
