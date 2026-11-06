// Pixel announcers for the broadcast booth, drawn in the same style as the
// players in sprites.ts. Busts only: they sit behind the desk.
//
// Keys: X hair, S skin, s skin shade, E eye, M mouth (closed), O mouth (open),
//       k headset, m mic, W shirt, T tie, C coat, c coat shade, '.' empty

const TALK_CLOSED = [
  '.....XXXXXX.....',
  '....XXXXXXXX....',
  '...kkkkkkkkkk...',
  '...XSSSSSSSSX...',
  '..kkSSESSESSkk..',
  '..kkSSSSSSSSkk..',
  '..kkSSSSsSSSkk..',
  '...mSSSMMSSS....',
  '....mmSSSSSS....',
  '.....sSSSSs.....',
  '......SSSS......',
  '..CCCCWWWWCCCC..',
  '.CCCCCWTTWCCCCC.',
  'CCCCCCWTTWCCCCCC',
  'CCCCCCCTTCCCCCCC',
  'CCCcCCCTTCCCcCCC',
  'CCCcCCCCCCCCcCCC',
  'CCCcCCCCCCCCcCCC',
]

const TALK_OPEN = TALK_CLOSED.map((row, i) =>
  i === 7 ? '...mSSSOOSSS....' : i === 8 ? '....mmSOOSSS....' : row,
)

// Both arms up: the color guy losing it.
const HYPE = [
  'S..............S',
  'S....XXXXXX....S',
  'S...XXXXXXXX...S',
  'Ss.kkkkkkkkkk.sS',
  'Cc.XSSSSSSSSX.cC',
  'Cckk.SESSES.kkcC',
  'CCkkSSSSSSSSkkCC',
  '.CkkSSSSsSSSkkC.',
  '.C.mSSOOOOSS..C.',
  '.CC.mmSOOSSS.CC.',
  '..CCCsSSSSsCCC..',
  '..CCCCSSSSCCCC..',
  '..CCCCWWWWCCCC..',
  '.CCCCCWTTWCCCCC.',
  'CCCCCCWTTWCCCCCC',
  'CCCcCCCTTCCCcCCC',
  'CCCcCCCCCCCCcCCC',
  'CCCcCCCCCCCCcCCC',
]

export type BoothPose = 'closed' | 'open' | 'hype'
const POSES: Record<BoothPose, string[]> = { closed: TALK_CLOSED, open: TALK_OPEN, hype: HYPE }

export interface Announcer { X: string; S: string; s: string; C: string; c: string; T: string }

/** Play-by-play: dark hair, navy blazer. */
export const PBP: Announcer = { X: '#2a1a10', S: '#d9a27a', s: '#b9825c', C: '#1f2d55', c: '#16213f', T: '#ffb627' }
/** Color analyst: grey hair, crimson blazer. */
export const COLOR: Announcer = { X: '#a7adb3', S: '#8a5536', s: '#6d4128', C: '#8c1d24', c: '#6a161c', T: '#f2efe4' }

const cache = new Map<string, string>()

export function announcerUrl(pose: BoothPose, who: Announcer): string {
  const key = `${pose}|${who.C}`
  const hit = cache.get(key)
  if (hit) return hit
  const rows = POSES[pose]
  const colors: Record<string, string> = { ...who, E: '#111111', M: '#5a2a1a', O: '#2a0d08', k: '#151515', m: '#2b2b2b', W: '#f2efe4' }
  let rects = ''
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]
      let run = 1
      while (x + run < row.length && row[x + run] === c) run++
      if (c !== '.' && colors[c]) rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${colors[c]}"/>`
      x += run
    }
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 18" width="16" height="18" shape-rendering="crispEdges">${rects}</svg>`
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`
  cache.set(key, url)
  return url
}
