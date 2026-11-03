import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dateForDrive, driveNumber, promptsForDrive, todayKey } from '../src/engine/schedule'

export const LOCK_PATH = fileURLToPath(new URL('./schedule-lock.json', import.meta.url))

export type Lock = Record<string, string[]>

export function readLock(): Lock {
  return existsSync(LOCK_PATH) ? JSON.parse(readFileSync(LOCK_PATH, 'utf8')) : {}
}

/** Records every drive through today so validate-data can catch any change to them. */
export function writeLock(): Lock {
  const lock = readLock()
  const today = driveNumber(todayKey())
  for (let d = 1; d <= today; d++) {
    if (!lock[d]) lock[d] = promptsForDrive(d).map((p) => p.id)
  }
  writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n')
  return lock
}

export { dateForDrive }
