import { readFileSync } from 'node:fs'
import { PROMPTS } from '../src/data/prompts'
import { TEAM_PROMPTS } from '../src/data/team-prompts'
import type { TierId } from '../src/data/types'
import { matchAnswer, type MatchResult } from '../src/engine/match'

for (const p of TEAM_PROMPTS) {
  const data = JSON.parse(readFileSync(new URL(`../public/${p.src}`, import.meta.url), 'utf8')) as { tiers: Record<string, string[]> }
  p.answers = Object.entries(data.tiers).flatMap(([t, names]) => names.map((name) => ({ name, aliases: [], tier: Number(t) as TierId })))
}
const all = [...PROMPTS, ...TEAM_PROMPTS]
const get = (id: string) => all.find((p) => p.id === id)!

const show = (r: MatchResult) =>
  r.kind === 'hit' ? `${r.answer.name} (T${r.answer.tier})`
    : r.kind === 'ambiguous' ? 'AMBIGUOUS: ' + r.options.map((o) => o.name).join('/')
      : r.kind === 'suggest' ? 'DID YOU MEAN: ' + r.options.map((o) => o.name).join(' / ')
        : r.kind

// [prompt, input, expected]: expected is "hit:<name>", "suggest:<name>", "ambiguous", or "miss".
const cases: [string, string, string][] = [
  // Exact, aliases, surnames
  ['sb-qb', 'Manning', 'ambiguous'], ['sb-qb', 'mahomes', 'hit:Patrick Mahomes'], ['sb-qb', 'Big Ben', 'hit:Ben Roethlisberger'],
  ['sb-qb', 'darnold', 'hit:Sam Darnold'], ['heisman', 'Jackson', 'ambiguous'], ['heisman', 'RG3', 'hit:Robert Griffin III'],
  ['heisman', 'johnny football', 'hit:Johnny Manziel'], ['heisman', 'oj simpson', 'hit:O.J. Simpson'],
  ['bowl', 'rose', 'hit:Rose Bowl'], ['bowl', 'the rose bowl', 'hit:Rose Bowl'], ['bowl', 'Duke’s Mayo Bowl', "hit:Duke's Mayo Bowl"],
  ['bowl', 'reliaquest', 'hit:ReliaQuest Bowl'], ['nfl-team', 'niners', 'hit:San Francisco 49ers'], ['nfl-team', 'Dallas', 'hit:Dallas Cowboys'],
  ['nfl-team', 'packers', 'hit:Green Bay Packers'], ['nfl-team', 'Oilers', 'miss'], ['big-12', 'Houston', 'hit:Houston'],
  ['big-12', 'coogs', 'hit:Houston'], ['sec', 'texas a and m', 'hit:Texas A&M'], ['sec', 'A&M', 'hit:Texas A&M'],
  ['penalty', 'false start', 'hit:False Start'], ['position', 'qb', 'hit:Quarterback'], ['position', 'k', 'hit:Kicker'],
  ['route-run', 'slant route', 'hit:Slant'], ['sb-coach', 'Harbaugh', 'hit:John Harbaugh'], ['texans-coach', "Bill O'Brien", 'hit:Bill O’Brien'],
  ['2000-yards', 'CJ2K', 'hit:Chris Johnson'], ['formation', 'shotgun formation', 'hit:Shotgun'], ['stat', 'yac', 'hit:Yards After Catch'],
  ['trick-play', 'fleaflicker', 'hit:Flea Flicker'],

  // Nicknames (data/nicknames.ts)
  ['sb-qb', 'The Sheriff', 'hit:Peyton Manning'], ['team-pit-rb', 'The Bus', 'hit:Jerome Bettis'], ['team-min-rb', 'All Day', 'hit:Adrian Peterson'],
  ['team-chi-rb', 'All Day', 'miss'], ['team-sea-rb', 'Beast Mode', 'hit:Marshawn Lynch'], ['team-sea-rb', 'beastmode', 'hit:Marshawn Lynch'],
  ['team-nyg-def', 'LT', 'hit:Lawrence Taylor'], ['team-chi-def', 'The Fridge', 'hit:William Perry'], ['team-dal-def', 'too tall', 'hit:Too Tall Jones'],
  ['team-buf-def', 'too tall', 'miss'], ['team-sf-qb', 'Mr. Irrelevant', 'hit:Brock Purdy'], ['team-dal-rb', 'Zeke', 'hit:Ezekiel Elliott'],
  ['team-was-qb', 'RG3', 'hit:Robert Griffin'], ['team-ten-def', 'Pacman', 'hit:Adam Jones'],

  // Typos: always asked, never counted on their own
  ['sb-qb', 'patrik mahomes', 'suggest:Patrick Mahomes'], ['sb-qb', 'Brett Farve', 'suggest:Brett Favre'], ['sb-qb', 'Farve', 'suggest:Brett Favre'],
  ['sb-qb', 'Rothlisberger', 'suggest:Ben Roethlisberger'], ['sb-qb', 'Mahomess', 'suggest:Patrick Mahomes'], ['sb-qb', 'Mannig', 'suggest:Peyton Manning'],
  ['sb-qb', 'Pat Mahomes', 'hit:Patrick Mahomes'], ['team-phi-qb', 'Mike Vick', 'hit:Michael Vick'], ['team-sf-qb', 'Capernick', 'suggest:Colin Kaepernick'],
  ['team-mia-qb', 'Tua Tagovaiola', 'suggest:Tua Tagovailoa'], ['team-pit-def', 'Polamalou', 'suggest:Troy Polamalu'],
  ['team-det-def', 'Ndamakong Suh', 'suggest:Ndamukong Suh'], ['team-det-rb', 'Jamyr Gibbs', 'suggest:Jahmyr Gibbs'],
  ['team-phi-qb', 'Mike Vik', 'suggest:Michael Vick'], ['penalty', 'pass interferance', 'suggest:Pass Interference'],
  ['trick-play', 'flee flicker', 'suggest:Flea Flicker'], ['nfl-team', 'Stealers', 'suggest:Pittsburgh Steelers'],

  // Wrong answers must not turn into right ones
  ['sb-qb', 'holmes', 'miss'], ['sb-qb', 'Jim Kelly', 'miss'], ['sb-qb', 'Kirk Cousins', 'miss'], ['team-pit-def', 'Tim Brown', 'miss'],
  ['team-det-rb', 'Eric Dickerson', 'miss'], ['team-ari-qb', 'Luck', 'miss'],
]

let bad = 0
for (const [id, input, want] of cases) {
  const r = matchAnswer(get(id), input)
  const [kind, name] = want.split(':')
  const ok = r.kind === kind && (!name || (r.kind === 'hit' ? r.answer.name === name : r.kind === 'suggest' && r.options[0].name === name))
  if (!ok) bad++
  console.log(ok ? '  ' : '✗ ', id.padEnd(14), JSON.stringify(input).padEnd(22), '->', show(r), ok ? '' : `   (expected ${want})`)
}
console.log(`\n${cases.length} cases, ${bad} unexpected`)
