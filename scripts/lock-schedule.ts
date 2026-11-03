// Freezes every drive through today into scripts/schedule-lock.json.
// Run it after shipping prompt changes; validate-data.ts then fails if a
// later change would alter a drive that has already been played.
import { writeLock, dateForDrive } from './schedule-tools'

const lock = writeLock()
const days = Object.keys(lock).map(Number).sort((a, b) => a - b)
console.log(`Locked drives #1-#${days.at(-1)} (through ${dateForDrive(days.at(-1)!)})`)
