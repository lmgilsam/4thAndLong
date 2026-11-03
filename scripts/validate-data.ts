import { PROMPTS } from '../src/data/prompts'
import { normalize, matchAnswer } from '../src/engine/match'
import { promptsForDrive } from '../src/engine/schedule'

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
console.log('\nPrompts:', PROMPTS.length, 'Problems:', problems)
for (let d = 1; d <= 6; d++) console.log('Drive', d, promptsForDrive(d).map(p => p.id).join(', '))
