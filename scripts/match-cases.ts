import { PROMPTS } from '../src/data/prompts'
import { matchAnswer } from '../src/engine/match'
const get = (id: string) => PROMPTS.find(p => p.id === id)!
const cases: [string, string][] = [
  ['sb-qb','Manning'],['sb-qb','mahomes'],['sb-qb','patrik mahomes'],['sb-qb','Big Ben'],['sb-qb','darnold'],
  ['heisman','Jackson'],['heisman','RG3'],['heisman','johnny football'],['heisman','oj simpson'],
  ['bowl','rose'],['bowl','the rose bowl'],['bowl','Duke’s Mayo Bowl'],['bowl','reliaquest'],
  ['nfl-team','niners'],['nfl-team','Dallas'],['nfl-team','packers'],['nfl-team','Oilers'],
  ['big-12','Houston'],['big-12','coogs'],['sec','texas a and m'],['sec','A&M'],
  ['penalty','pass interferance'],['penalty','false start'],['position','qb'],['position','k'],
  ['route-run','slant route'],['trick-play','flee flicker'],['sb-coach','Harbaugh'],['texans-coach',"Bill O'Brien"],
  ['2000-yards','CJ2K'],['formation','shotgun formation'],['stat','yac'],
]
for (const [id, input] of cases) {
  const r = matchAnswer(get(id), input)
  console.log(id.padEnd(14), JSON.stringify(input).padEnd(24), '->', r.kind === 'hit' ? `${r.answer.name} (T${r.answer.tier})` : r.kind === 'ambiguous' ? 'AMBIGUOUS: ' + r.options.map(o=>o.name).join('/') : r.kind)
}
