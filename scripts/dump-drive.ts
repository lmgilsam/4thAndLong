import { promptsForDrive, driveNumber, todayKey } from '../src/engine/schedule'
const n = driveNumber(todayKey())
const out = promptsForDrive(n).map(p => ({ id: p.id, text: p.text, byTier: [1,2,3,4,5].map(t => p.answers.filter(a => a.tier === t).map(a => a.name)) }))
console.log(JSON.stringify({ n, prompts: out }))
