// Original 8-bit football player sprites for the home-page field.
// Each sprite is a grid of palette keys, drawn facing right; the defense
// is the same art mirrored. Rendered once per (pose, team, skin) to a tiny
// SVG data URL and scaled up with crisp pixels.
//
// Keys: H helmet, h helmet stripe, M facemask, S skin, s skin shade,
//       J jersey, j jersey shade, N jersey number, P pants, p pants shade,
//       K socks, B cleats, F football, f football shade, L laces, '.' empty

export type BasePose = 'stand' | 'ready' | 'stance' | 'block' | 'hold' | 'windup' | 'follow'
/** Running poses come in a 4-frame cycle: run0..run3, carry0..3, reach0..3, holdrun0..3. */
export type CycleName = 'run' | 'carry' | 'reach' | 'holdrun'
export type Pose = BasePose | `${CycleName}${0 | 1 | 2 | 3}`

const BASE: Record<BasePose, string[]> = {
  // Upright skill player (QB, WR, safety)
  stand: [
    '....HHHH....',
    '...HHHHHH...',
    '..HhHHHHHH..',
    '..HhHHHSSM..',
    '..HhHHHSSM..',
    '...HHHSSs...',
    '..JJJJJJJJ..',
    '.JJJJJJJJJJ.',
    '.JjJNNNJJJJ.',
    '.SjJNJNJJJS.',
    '.SjJNNNJJJS.',
    '.S.JJJJJJ.S.',
    '...PPPPPP...',
    '...PPppPP...',
    '...PP..PP...',
    '...KK..KK...',
    '...KK..KK...',
    '..BBB..BBB..',
  ],
  // Knees bent, hands up (linebacker, corner)
  ready: [
    '............',
    '....HHHH....',
    '...HHHHHH...',
    '..HhHHHHHH..',
    '..HhHHHSSM..',
    '..HhHHHSSM..',
    '...HHHSSs...',
    '.JJJJJJJJJJ.',
    'JJJJNNNJJJJJ',
    'JjJJNJNJJJSS',
    'SjJJNNNJJJ.S',
    'S..JJJJJJ...',
    '..PPPPPPP...',
    '.PPPp..PPP..',
    '.PP......PP.',
    '.KK......KK.',
    '.KK......KK.',
    'BBB......BBB',
  ],
  // Three-point stance (linemen)
  stance: [
    '..............',
    '..............',
    '..............',
    '.........HHHH.',
    '........HHHHHH',
    '.......HhHHSSM',
    '...JJJJHhHHSSM',
    '.JJJJJJJJHHSs.',
    'JJJJJJjJJJJJ..',
    'JJJJJJjJJJJJS.',
    'PPJJJJjJJJJ.S.',
    'PPPJJJJJJJ..S.',
    'PPPP....PP..S.',
    '.PPP....PP..S.',
    '..PP....KK....',
    '..KK....KK....',
    '..KK....KK....',
    '.BBB...BBB....',
  ],
  // Engaged block: upright, leaning in, arms locked out into the man across
  block: [
    '......HHHH....',
    '.....HHHHHH...',
    '....HhHHHHHH..',
    '....HhHHHSSM..',
    '....HhHHHSSM..',
    '.....HHHSSs...',
    '...JJJJJJJJ...',
    '..JJJJJJJJJSSS',
    '..JjJJNNNJJJSS',
    '..JjJJNJNJJ...',
    '..jJJJNNNJ....',
    '..JJJJJJJJ....',
    '..PPPPPPPP....',
    '.PPPp...PPP...',
    '.PPP.....PP...',
    '.KK.......KK..',
    '.KK.......KK..',
    'BBB.......BBB.',
  ],
  // QB with the ball tucked against his chest in both hands
  hold: [
    '....HHHH....',
    '...HHHHHH...',
    '..HhHHHHHH..',
    '..HhHHHSSM..',
    '..HhHHHSSM..',
    '...HHHSSs...',
    '..JJJJJJJJ..',
    '.JJJJJJJJJJ.',
    '.JjJJJJFFSS.',
    '.JjJJJFFLFS.',
    '.SjJJFFLFfJ.',
    '.SSSSSffJJ..',
    '...JJJJJJ...',
    '...PPPPPP...',
    '...PPppPP...',
    '...PP..PP...',
    '...KK..KK...',
    '..BBB..BBB..',
  ],
  // QB cocking to throw: ball up behind the helmet, lead arm pointing at the target
  windup: [
    '.FF.HHHH....',
    '.FFHHHHHH...',
    '.SHhHHHHHH..',
    '.S.hHHHSSM..',
    '.SJhHHHSSM..',
    '.SJJHHSSs...',
    '..JJJJJJJJ..',
    '.JJJJJJJJJJ.',
    '..jJNNNJJJSS',
    '..jJNJNJJJ.S',
    '..jJNNNJJJ..',
    '...JJJJJJ...',
    '...PPPPPP...',
    '..PPP.PPP...',
    '.PPP...PP...',
    '.KK....KK...',
    '.KK.....KK..',
    'BBB.....BBB.',
  ],
  // QB follow-through: throwing arm swept forward and down, back foot coming off the turf
  follow: [
    '....HHHH....',
    '...HHHHHH...',
    '..HhHHHHHH..',
    '..HhHHHSSM..',
    '..HhHHHSSM..',
    '...HHHSSs...',
    '..JJJJJJJJ..',
    '.JJJJJJJJJJS',
    '.JjJNNNJJJSS',
    '.SjJNJNJJS..',
    '.S.JNNNJS...',
    '...JJJJJS...',
    '...PPPPPP...',
    '..PPP.PPPP..',
    '.PP.....PP..',
    'KK......KK..',
    'B.......KK..',
    '.......BBB..',
  ],
}

// ---- Running: upper bodies and legs are drawn separately and combined, so every
// running pose (plain run, carrying the ball, reaching for a catch, the QB's drop
// with the ball) shares the exact same leg cycle and switching between them
// never breaks stride.

const HEAD_LEAN = [
  '.....HHHH...',
  '....HHHHHH..',
  '...HhHHHHHH.',
  '...HhHHHSSM.',
  '...HhHHHSSM.',
  '....HHHSSs..',
]

const UPPER = {
  // Arms pumping: front arm forward and up, back arm driving back
  armsA: [...HEAD_LEAN,
    '..JJJJJJJJ..',
    '.JJJJJJJJJSS',
    'SJjJNNNJJJ.S',
    'S.jJNJNJJ...',
    '...JNNNJJ...',
    '...JJJJJJ...'],
  // Arms passing the body
  armsMid: [...HEAD_LEAN,
    '..JJJJJJJJ..',
    '.JJJJJJJJJ..',
    '.SjJNNNJJS..',
    '..SJNJNJJS..',
    '...JNNNJJ...',
    '...JJJJJJ...'],
  // Arms swapped
  armsB: [...HEAD_LEAN,
    '..JJJJJJJJ..',
    'SJJJJJJJJJ..',
    'SSjJNNNJJJS.',
    '..jJNJNJJJS.',
    '...JNNNJJ...',
    '...JJJJJJ...'],
  // Ball tucked high and tight, free arm pumping
  carryA: [...HEAD_LEAN,
    '..JJJJJJJJ..',
    '.JJJJJJFFJ..',
    'SJjJJJFLFJ..',
    'S.jJJFFLFS..',
    '...JJffSSJ..',
    '...JJJJJJ...'],
  carryB: [...HEAD_LEAN,
    '..JJJJJJJJ..',
    '.JJJJJJFFJ..',
    '.SjJJJFLFJ..',
    '.SjJJFFLFS..',
    '...JJffSSJ..',
    '...JJJJJJ...'],
  // Both hands up for the catch (one row taller: the hands rise above the helmet)
  reach: [
    '........SS..',
    '....HHHHSS..',
    '...HHHHHHS..',
    '..HhHHHHHS..',
    '..HhHHHSSM..',
    '..HhHHHSSM..',
    '...HHHSSs...',
    '..JJJJJJJ...',
    '.JJJJJJJJ...',
    '.JjJNNNJJ...',
    '.JjJNJNJJ...',
    '..jJNNNJ....',
    '...JJJJJ....'],
  // QB on his drop, ball at his chest
  hold: [
    '....HHHH....',
    '...HHHHHH...',
    '..HhHHHHHH..',
    '..HhHHHSSM..',
    '..HhHHHSSM..',
    '...HHHSSs...',
    '..JJJJJJJJ..',
    '.JJJJJJJJJJ.',
    '.JjJJJJFFSS.',
    '.JjJJJFFLFS.',
    '.SjJJFFLFfJ.',
    '.SSSSSffJJ..'],
}

// Four-frame leg cycle: stride, passing, stride (other leg), passing.
const LEGS = [
  ['...PPPPPP...',
   '..PPP.PPPP..',
   '.PPP....PPP.',
   '.KK.....KK..',
   'KK.......KK.',
   'B.........BB'],
  ['...PPPPPP...',
   '...PPPPPPP..',
   '...PP..PPPP.',
   '...KK...KK..',
   '...KK.......',
   '..BBB.......'],
  ['...PPPPPP...',
   '..PPPP.PPP..',
   '.PPP....PP..',
   'KK.......KK.',
   'B........KK.',
   '.........BBB'],
  ['...PPPPPP...',
   '..PPPPPP....',
   '.PPPP.PP....',
   'BKK...KK....',
   '......KK....',
   '.....BBB....'],
]

const CYCLES: Record<CycleName, string[][]> = {
  run: [UPPER.armsA, UPPER.armsMid, UPPER.armsB, UPPER.armsMid],
  carry: [UPPER.carryA, UPPER.carryB, UPPER.carryA, UPPER.carryB],
  reach: [UPPER.reach, UPPER.reach, UPPER.reach, UPPER.reach],
  holdrun: [UPPER.hold, UPPER.hold, UPPER.hold, UPPER.hold],
}

export const SPRITES = { ...BASE } as Record<Pose, string[]>
for (const [name, uppers] of Object.entries(CYCLES)) {
  uppers.forEach((upper, i) => { SPRITES[`${name as CycleName}${i as 0 | 1 | 2 | 3}`] = [...upper, ...LEGS[i]] })
}

export interface TeamColors {
  H: string; h: string; M: string; J: string; j: string; N: string; P: string; p: string; K: string; B: string
}

/** Home side (offense, left): gold jerseys, navy helmets. Invented colors, no real team. */
export const GOLD: TeamColors = {
  H: '#1f2d55', h: '#ffb627', M: '#c9d1d9', J: '#ffb627', j: '#c98a10', N: '#1f2d55',
  P: '#f2efe4', p: '#c9c4b4', K: '#1f2d55', B: '#111111',
}

/** Away side (defense, right): crimson jerseys, white helmets. */
export const CRIMSON: TeamColors = {
  H: '#f2efe4', h: '#b8323a', M: '#5a5f66', J: '#b8323a', j: '#7f1f26', N: '#f2efe4',
  P: '#9aa3ab', p: '#7a838b', K: '#b8323a', B: '#111111',
}

export const SKINS: [string, string][] = [
  ['#f1c7a1', '#d7a57d'],
  ['#d9a27a', '#b9825c'],
  ['#b47a52', '#93603e'],
  ['#8a5536', '#6d4128'],
  ['#5e3a24', '#4a2c1a'],
]

const cache = new Map<string, string>()

/** Data URL for a sprite. Width/height are in sprite pixels. */
export function spriteUrl(pose: Pose, team: TeamColors, skin: number): { url: string; w: number; h: number } {
  const rows = SPRITES[pose]
  const w = rows[0].length
  const h = rows.length
  const key = `${pose}|${team.J}|${skin}`
  let url = cache.get(key)
  if (!url) {
    const [S, s] = SKINS[skin % SKINS.length]
    const colors: Record<string, string> = { ...team, S, s, F: '#9a5528', f: '#4e2610', L: '#f2efe4' }
    let rects = ''
    rows.forEach((row, y) => {
      // Merge runs of the same color into one rect to keep the SVG small.
      let x = 0
      while (x < row.length) {
        const c = row[x]
        let run = 1
        while (x + run < row.length && row[x + run] === c) run++
        if (c !== '.' && colors[c]) rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${colors[c]}"/>`
        x += run
      }
    })
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">${rects}</svg>`
    url = `data:image/svg+xml,${encodeURIComponent(svg)}`
    cache.set(key, url)
  }
  return { url, w, h }
}
