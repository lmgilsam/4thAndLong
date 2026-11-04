import { useEffect, useRef } from 'react'
import { fx, reducedMotion } from '../lib/fx'
import { CRIMSON, GOLD, spriteUrl, type BasePose, type CycleName, type Pose, type TeamColors } from './sprites'

// The home-page field: gold (offense, left, going right) drives on crimson.
// Four plays in a row, seen from the sideline. Each play keeps the same
// blocking and QB motion (snap, drop, windup, throw, follow-through) but the
// receivers run different routes and the ball goes to a different man. The
// ball is spotted where each play ends and the camera pans to the new line of
// scrimmage. Every completion ends with the covering defender diving in and
// tackling the ball carrier. Play 4 is a touchdown: everyone on offense jumps
// and cheers, then the drive starts over.
//
// The field (stripes, yard lines, end zone, line of scrimmage, line to gain) is
// drawn here in SVG so it can scroll with the camera. 3D CSS would blur the
// pixel art, so everything is projected in 2D with the same perspective as the
// stadium turf (520px perspective, 62deg tilt).
//
// Units: x in yards. Field x runs 0 (gold's goal line) to 100 (crimson's goal
// line); the end zone the offense attacks is 100..110. Player spots are relative
// to the line of scrimmage. z is across the field (0 = middle of the formation,
// + = nearer the camera).

type Role = 'ol' | 'te' | 'qb' | 'rb' | 'wrFar' | 'wrSlot' | 'wrNear' | 'dl' | 'lb' | 'cbFar' | 'cbSlot' | 'cbNear' | 'saf'
type Receiver = 'wrFar' | 'wrSlot' | 'wrNear' | 'te'
interface Spot { x: number; z: number; pose: BasePose; role: Role; skin: number }

const OFFENSE: Spot[] = [
  { x: -1.2, z: -2.4, pose: 'stance', role: 'ol', skin: 1 },
  { x: -1.2, z: -1.2, pose: 'stance', role: 'ol', skin: 3 },
  { x: -1.2, z: 0, pose: 'stance', role: 'ol', skin: 0 },
  { x: -1.2, z: 1.2, pose: 'stance', role: 'ol', skin: 4 },
  { x: -1.2, z: 2.4, pose: 'stance', role: 'ol', skin: 2 },
  { x: -1.5, z: 3.8, pose: 'stance', role: 'te', skin: 1 },
  { x: -5, z: 0.3, pose: 'stand', role: 'qb', skin: 0 },
  { x: -5.6, z: 2, pose: 'ready', role: 'rb', skin: 4 },
  { x: -1.5, z: -9, pose: 'ready', role: 'wrFar', skin: 3 },
  { x: -1.8, z: -5.5, pose: 'ready', role: 'wrSlot', skin: 2 },
  { x: -1.5, z: 6.5, pose: 'ready', role: 'wrNear', skin: 4 },
]

const DEFENSE: Spot[] = [
  { x: 1.2, z: -1.2, pose: 'stance', role: 'dl', skin: 4 },
  { x: 1.2, z: 0, pose: 'stance', role: 'dl', skin: 2 },
  { x: 1.2, z: 1.2, pose: 'stance', role: 'dl', skin: 3 },
  { x: 1.2, z: 2.4, pose: 'stance', role: 'dl', skin: 0 },
  { x: 4.8, z: -2.8, pose: 'ready', role: 'lb', skin: 1 },
  { x: 4.6, z: 0.4, pose: 'ready', role: 'lb', skin: 4 },
  { x: 4.8, z: 3.2, pose: 'ready', role: 'lb', skin: 2 },
  { x: 6, z: -9, pose: 'ready', role: 'cbFar', skin: 3 },
  { x: 5.2, z: -5.5, pose: 'ready', role: 'cbSlot', skin: 0 },
  { x: 6, z: 6.5, pose: 'ready', role: 'cbNear', skin: 4 },
  { x: 10, z: -1.5, pose: 'stand', role: 'saf', skin: 1 },
]

const spotOf = (role: Role) => OFFENSE.find((s) => s.role === role) ?? DEFENSE.find((s) => s.role === role)!
const QB = spotOf('qb')
const CENTER = OFFENSE.find((s) => s.role === 'ol' && s.z === 0)!
/** Man coverage: each corner shadows one receiver. */
const MAN: Partial<Record<Role, Receiver>> = { cbFar: 'wrFar', cbSlot: 'wrSlot', cbNear: 'wrNear' }

// ---------------------------------------------------------------- the plays

type Path = [number, number][] // route waypoints (dx, dz) from the receiver's spot

interface PlayDef {
  name: string
  target: Receiver
  /** Yards along the target's route where he makes the catch. */
  catchAt: number
  routes: Record<Receiver, Path>
}

// Routes end where each receiver stops; the target's route includes his run after the catch.
const PLAYS: PlayDef[] = [
  { name: 'slant', target: 'wrSlot', catchAt: 7.5, routes: {
    wrSlot: [[2, 0], [8, 4], [14, 5.5]],
    wrFar: [[16, 0]],
    wrNear: [[9, 0], [7.5, -0.6]],
    te: [[1, 0], [4, 2]],
  } },
  { name: 'seam', target: 'te', catchAt: 10, routes: {
    te: [[13.5, 0]],
    wrFar: [[8, 0], [15, 3.5]],
    wrSlot: [[6, 0], [6.5, -4]],
    wrNear: [[16, 0]],
  } },
  { name: 'out', target: 'wrNear', catchAt: 13.2, routes: {
    wrNear: [[12, 0], [13, 2], [16, 2.5]],
    wrFar: [[12, 0], [10.5, 0.5]],
    wrSlot: [[9, 0], [9.5, 6]],
    te: [[3, 0], [4, -4]],
  } },
  { name: 'post (touchdown)', target: 'wrFar', catchAt: 20, routes: {
    wrFar: [[7, 0], [22, 5.5]],
    wrSlot: [[10, 0], [10, -3]],
    wrNear: [[6, 0], [6, -3]],
    te: [[2, 0], [5, 2.5]],
  } },
]

const START_LOS = 45 // gold's own 45
const SPEED: Record<Receiver, number> = { wrFar: 3.8, wrSlot: 3.8, wrNear: 3.8, te: 3.2 } // yards per second

// ---------------------------------------------------------------- timing

const PRE = 2.4 // seconds lined up before the snap (fade in over the first FADE)
const FADE = 0.45
const POST = 0.8 // after the whistle
const CELEBRATE = 3.4 // after the touchdown whistle
const PAN = 1.1 // camera moves to the next line of scrimmage while players are hidden
const SNAP = PRE
const SNAP_FLIGHT = 0.32 // seconds for the shotgun snap to reach the QB
const WINDUP = 0.3 // QB cocking the ball before release
const FOLLOW = 0.7 // follow-through after release
const REACH = 0.35 // receiver reaches for the ball before it arrives
const LOCK = 0.3 // lines come out of their stances and meet
const ENGAGE = 5 // sprite px between an engaged lineman's center and the line

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 2)
const prog = (t: number, a: number, b: number) => ease((t - a) / (b - a))
const lerp = (a: number, b: number, f: number) => a + (b - a) * f
const lin = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))

function pathLength(p: Path): number {
  let len = 0
  let prev: [number, number] = [0, 0]
  for (const pt of p) { len += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]); prev = pt }
  return len
}

/**
 * Point `dist` yards along a route (starting at the receiver's spot). With
 * `extend`, a receiver who reaches the end keeps running in the route's last
 * direction (bending downfield) until the whistle instead of stopping.
 */
function along(p: Path, dist: number, extend = false): [number, number] {
  let prev: [number, number] = [0, 0]
  let left = Math.max(0, dist)
  for (const pt of p) {
    const seg = Math.hypot(pt[0] - prev[0], pt[1] - prev[1])
    if (left <= seg) {
      const f = seg ? left / seg : 0
      return [lerp(prev[0], pt[0], f), lerp(prev[1], pt[1], f)]
    }
    left -= seg
    prev = pt
  }
  if (!extend || left <= 0) return prev
  const before = p.length > 1 ? p[p.length - 2] : [0, 0]
  let ex = prev[0] - before[0]
  let ez = (prev[1] - before[1]) * 0.35
  if (ex < 0.5) ex = Math.max(ex, 0) + 1 // comebacks and flats turn upfield
  const n = Math.hypot(ex, ez) || 1
  return [prev[0] + (ex / n) * left * 0.85, prev[1] + (ez / n) * left * 0.85]
}

interface Sched {
  play: PlayDef
  index: number
  los: number
  start: number // global seconds when this play fades in
  catchT: number // local seconds (from start)
  throwT: number
  tackleT: number // local: the carrier goes down (or crosses the goal line on a touchdown)
  tackler: Role // who makes the tackle
  whistle: number
  end: number // local: players fully faded out
  drop: number // yards the QB drops
  dropEnd: number
  td: boolean
}

/** Lays out the whole drive: when each play happens and where the ball is spotted. */
function buildDrive(): { plays: Sched[]; loop: number } {
  const plays: Sched[] = []
  let los = START_LOS
  let start = 0
  PLAYS.forEach((play, index) => {
    const target = spotOf(play.target)
    const route = play.routes[play.target]
    const v = SPEED[play.target]
    const catchT = SNAP + play.catchAt / v
    const [cx, cz] = along(route, play.catchAt)
    const throwDist = Math.hypot(target.x + cx - (QB.x - 3), target.z + cz - QB.z)
    const earliest = SNAP + SNAP_FLIGHT + WINDUP + 0.25
    const throwT = Math.max(earliest, catchT - (0.5 + 0.035 * throwDist))
    const dropEnd = Math.min(SNAP + 1.3, throwT - WINDUP)
    const drop = dropEnd - SNAP > 0.9 ? 3 : 1.5 // quick throws get a short drop
    const tackleT = SNAP + pathLength(route) / v
    const routeEnd = los + target.x + route[route.length - 1][0]
    const td = routeEnd >= 100
    const finalX = td ? routeEnd : routeEnd - DRIVE_BACK // the hit drives him back a little
    const whistle = tackleT + (td ? 0.15 : 0.55)
    const end = whistle + (td ? CELEBRATE : POST) + FADE
    // The corner on the target makes the tackle; the safety gets the tight end.
    const tackler = (Object.keys(MAN) as Role[]).find((r) => MAN[r] === play.target) ?? 'saf'
    plays.push({ play, index, los, start, catchT, throwT, tackleT, tackler, whistle, end, drop, dropEnd, td })
    start += end + PAN
    los = Math.round(finalX)
  })
  return { plays, loop: start }
}


// ---------------------------------------------------------------- movement

type Frame = 'run' | 'block' | 'hold' | 'windup' | 'follow' | 'reach' | 'carry' | 'cheer' | 'cheerball' | 'stand' | 'launch' | 'dive' | 'fall' | 'down' | 'downball'

interface Move {
  dx: number // yards along the field from the player's spot
  dz: number
  ux?: number // extra sprite px along the field (linemen meeting exactly)
  lift?: number // sprite px off the turf (jumping, diving, lying on top of someone)
  onTop?: boolean // draw above whoever is at the same spot (the tackler on the pile)
  frame?: Frame
}

/** A receiver's spot on his route at time t. The target stops where he's tackled; everyone else keeps running until the whistle. */
function routePos(r: Receiver, t: number, S: Sched): [number, number] {
  const isTarget = r === S.play.target
  const stop = isTarget ? S.tackleT : S.whistle
  return along(S.play.routes[r], SPEED[r] * Math.max(0, Math.min(t, stop) - SNAP), !isTarget)
}

// The tackle, as one motion (times relative to contact at S.tackleT):
//   close in running  ->  LAUNCH: push off  ->  DIVE: laid out in the air, hits the
//   carrier and drives him back  ->  both on the turf, tackler on top.
const CLOSE = 0.9 // seconds the tackler takes to close on the carrier
const LAUNCH = 0.42 // push-off starts this long before contact
const AIR = 0.28 // fully laid out this long before contact
const SETTLE = 0.3 // seconds from contact until both are down
const DRIVE_BACK = 0.7 // yards the hit drives the carrier back

/** Where the ball carrier is at time t, including being driven back by the hit. */
function carrierPos(t: number, S: Sched): { x: number; z: number } {
  const target = spotOf(S.play.target)
  const [cx, cz] = routePos(S.play.target, t, S)
  const back = S.td ? 0 : DRIVE_BACK * prog(t, S.tackleT, S.tackleT + SETTLE)
  return { x: target.x + cx - back, z: target.z + cz }
}

/**
 * The tackler breaks off his coverage, closes on the ball carrier, launches,
 * flies in laid out, hits him, and they go down together with the tackler on
 * top. Returns null when this player isn't making the tackle right now.
 */
function tackle(s: Spot, t: number, S: Sched, normal: (t: number) => Move): Move | null {
  if (S.td || s.role !== S.tackler || t < S.tackleT - CLOSE) return null
  const from = normal(S.tackleT - CLOSE)
  const start = { x: s.x + from.dx, z: s.z + from.dz }
  const contact = carrierPos(S.tackleT, S)
  const side = start.x >= contact.x ? 1 : -1
  let x: number, z: number, lift: number, frame: Frame
  if (t < S.tackleT) {
    // Close in to just in front of the carrier, arriving at the moment of contact.
    const f = prog(t, S.tackleT - CLOSE, S.tackleT)
    x = lerp(start.x, contact.x + side * 1.1, f)
    z = lerp(start.z, contact.z, f)
    if (t < S.tackleT - LAUNCH) { frame = 'run'; lift = 0 }
    else if (t < S.tackleT - AIR) { frame = 'launch'; lift = 2 * lin(t, S.tackleT - LAUNCH, S.tackleT - AIR) }
    else { frame = 'dive'; lift = 2 + 6 * Math.sin((Math.PI / 2) * lin(t, S.tackleT - AIR, S.tackleT)) }
  } else {
    // Contact: ride the carrier down and end up lying across him.
    const f = prog(t, S.tackleT, S.tackleT + SETTLE)
    const c = carrierPos(t, S)
    // Ends up lying on the carrier's back and legs, so the carrier's helmet and the ball still show.
    x = lerp(contact.x + side * 1.1, c.x + side * 0.6, f)
    z = c.z
    frame = t < S.tackleT + SETTLE * 0.6 ? 'dive' : 'down'
    lift = lerp(8, 3.5, f)
  }
  return { dx: x - s.x, dz: z - s.z, lift, frame, onTop: t >= S.tackleT - 0.05 }
}

/** Where a defensive back would be if he weren't making the tackle. */
function coverage(s: Spot, t: number, S: Sched): Move {
  if (t < SNAP) return { dx: 0, dz: 0 }
  if (s.role === 'saf') {
    // Reads the QB and drives toward where the ball is going.
    const ts = spotOf(S.play.target)
    const [cx, cz] = along(S.play.routes[S.play.target], S.play.catchAt)
    const f = prog(t, SNAP + 0.3, S.catchT + 0.6)
    return { dx: (ts.x + cx + 3 - s.x) * f, dz: (ts.z + cz - s.z) * f }
  }
  // Man coverage: shadow the receiver a step behind, playing over the top.
  const man = MAN[s.role]!
  const ms = spotOf(man)
  const [mx, mz] = routePos(man, t - 0.3, S)
  const e = prog(t, SNAP, SNAP + 0.9)
  const tx = ms.x + mx + 1.3
  const tz = ms.z + mz - 0.7 // a step farther from the camera, so the receiver (and the catch) stays in view
  return { dx: (tx - s.x) * e, dz: (tz - s.z) * e }
}

function move(s: Spot, t: number, S: Sched): Move {
  const live = t > SNAP && t < S.whistle
  const celebrating = S.td && t >= S.whistle
  const offense = OFFENSE.includes(s)
  if (t < SNAP) return { dx: 0, dz: 0 }

  // Touchdown: offense jumps and cheers where it stands, defense stands there.
  const jump = celebrating ? 7 * Math.abs(Math.sin((t - S.whistle) * 5.5 + s.z * 1.7 + s.x)) : 0
  const cheer = (m: Move, scorer = false): Move =>
    celebrating ? { ...m, frame: offense ? (scorer ? 'cheerball' : 'cheer') : 'stand', lift: offense ? jump : 0 } : m

  switch (s.role) {
    case 'ol': case 'dl': {
      // Both lines fire out and meet at the ball, then push and pull together.
      const side = s.role === 'ol' ? -1 : 1
      const e = prog(t, SNAP, SNAP + LOCK)
      const drive = 1.6 * prog(t, SNAP + LOCK, S.whistle)
      const tussle = 0.9 * Math.sin(t * 7 + s.z * 2.3) * (live ? 1 : 0) * e
      const help = s.role === 'ol' && s.z < -2 ? 0.6 * e : 0 // the uncovered guard helps inside
      return cheer({ dx: -s.x * e, dz: help, ux: side * ENGAGE * e + drive + tussle, frame: 'block' })
    }
    case 'qb': {
      // Ball at his chest from the snap, then windup, release, and a step into the follow-through.
      const frame: Frame | undefined =
        t < SNAP + SNAP_FLIGHT ? undefined
        : t < S.throwT - WINDUP ? 'hold'
        : t < S.throwT ? 'windup'
        : t < S.throwT + FOLLOW ? 'follow'
        : undefined
      return cheer({ dx: -S.drop * prog(t, SNAP + 0.25, S.dropEnd) + 0.5 * prog(t, S.throwT - 0.1, S.throwT + 0.4), dz: 0, frame })
    }
    case 'rb':
      return cheer({ dx: 0.6 * prog(t, SNAP, SNAP + 0.8), dz: -1.1 * prog(t, SNAP, SNAP + 0.8), frame: t > SNAP + 0.5 ? 'block' : 'run' })
    case 'wrFar': case 'wrSlot': case 'wrNear': case 'te': {
      if (s.role !== S.play.target) {
        const [dx, dz] = routePos(s.role, t, S)
        return cheer({ dx, dz, frame: t < S.whistle ? 'run' : 'stand' })
      }
      const c = carrierPos(t, S)
      const dx = c.x - s.x
      const dz = c.z - s.z
      // The target reaches as the ball arrives, catches it, tucks it and runs until he's brought down.
      const frame: Frame =
        t < S.catchT - REACH ? 'run'
        : t < S.catchT + 0.15 ? 'reach'
        : t < S.tackleT ? 'carry'
        : S.td ? 'hold'
        : t < S.tackleT + SETTLE * 0.6 ? 'fall'
        : 'downball'
      return cheer({ dx, dz, frame }, true)
    }
    case 'cbFar': case 'cbSlot': case 'cbNear': case 'saf': {
      const normal = (tt: number) => coverage(s, tt, S)
      return tackle(s, t, S, normal) ?? cheer({ ...normal(t), frame: t < S.whistle ? 'run' : 'stand' })
    }
    case 'lb': {
      const ts = spotOf(S.play.target)
      const drift = (ts.z - s.z) * 0.25 * prog(t, SNAP + 0.6, S.catchT + 0.5)
      return cheer({ dx: 3 * prog(t, SNAP, SNAP + 2.2), dz: drift, frame: t < S.whistle ? 'run' : 'stand' })
    }
  }
}

// ---------------------------------------------------------------- the ball

/** Where a player's hands are: [x yards, z yards, ux sprite px, lift sprite px], relative to the line. */
type BallSpot = [number, number, number, number]
function hands(s: Spot, t: number, S: Sched, ux = 3, lift = 9): BallSpot {
  const m = move(s, t, S)
  return [s.x + m.dx, s.z + m.dz, (m.ux ?? 0) + ux, lift]
}
const mix = (a: BallSpot, b: BallSpot, f: number): BallSpot => a.map((v, i) => v + (b[i] - v) * f) as BallSpot

/** The ball's path: under the center, snapped to the QB, carried on the drop, thrown, caught. */
function ballAt(t: number, S: Sched): BallSpot {
  const atCenter: BallSpot = [CENTER.x, CENTER.z, 6, 0.5]
  const target = spotOf(S.play.target)
  if (t < SNAP) return atCenter
  if (t < SNAP + SNAP_FLIGHT) {
    const f = (t - SNAP) / SNAP_FLIGHT
    const p = mix(atCenter, hands(QB, t, S), f)
    p[3] += 4 * Math.sin(Math.PI * f)
    return p
  }
  if (t < S.throwT) return hands(QB, t, S)
  if (t < S.catchT) {
    const f = (t - S.throwT) / (S.catchT - S.throwT)
    const p = mix(hands(QB, S.throwT, S, 6, 17), hands(target, S.catchT, S, 4, 18), f)
    p[3] += (14 + 0.5 * Math.abs(p[0])) * Math.sin(Math.PI * f)
    return p
  }
  return hands(target, t, S)
}

/** Ball visible as its own sprite only when nobody is holding it. */
const ballLoose = (t: number, S: Sched) => t < SNAP + SNAP_FLIGHT || (t >= S.throwT && t < S.catchT)

// ---------------------------------------------------------------- sprite frames

const cycle = (name: CycleName): Pose[] => [0, 1, 2, 3].map((i) => `${name}${i}` as Pose)
const RUN = cycle('run')
const RECEIVER_FRAMES: Pose[] = [...RUN, ...cycle('reach'), ...cycle('carry'), 'hold', 'stand', 'fall', 'downball', 'cheer', 'cheerball']
const DB_FRAMES: Pose[] = [...RUN, 'stand', 'launch', 'dive', 'down']

/** Every sprite each role can show (besides its starting pose). */
const FRAMES: Record<Role, Pose[]> = {
  ol: ['block', 'cheer'], te: RECEIVER_FRAMES, qb: ['hold', ...cycle('holdrun'), 'windup', 'follow', 'cheer'],
  rb: [...RUN, 'block', 'cheer'], wrFar: RECEIVER_FRAMES, wrSlot: RECEIVER_FRAMES, wrNear: RECEIVER_FRAMES,
  dl: ['block', 'stand'], lb: [...RUN, 'stand'], cbFar: DB_FRAMES, cbSlot: DB_FRAMES, cbNear: DB_FRAMES, saf: DB_FRAMES,
}

/** Yards covered per frame of the running cycle. */
const STRIDE = 0.45
/** These always face downfield (linemen stay locked up; the QB keeps his eyes downfield on the drop). */
const FIXED_FACING = new Set<Role>(['ol', 'dl', 'qb'])

/** The sprite to show for a player, and which way he faces. */
function pose(s: Spot, t: number, S: Sched, step: number, defaultFlip: boolean): { pose: Pose | null; flip: boolean; moving: boolean } {
  const m = move(s, t, S)
  const p = move(s, t - 0.06, S)
  const vx = (m.dx - p.dx) / 0.06
  const speed = Math.hypot(m.dx - p.dx, m.dz - p.dz) / 0.06
  const moving = t > SNAP && speed > 0.6 && !(S.td && t >= S.whistle)
  // Face the way you're running once the play is on; otherwise face the other team.
  let flip = !FIXED_FACING.has(s.role) && moving && Math.abs(vx) > 0.6 ? vx < 0 : defaultFlip
  // The tackler faces the ball carrier for the dive and stays that way on the turf.
  if (s.role === S.tackler && !S.td && t >= S.tackleT - CLOSE) {
    const ts = spotOf(S.play.target)
    flip = s.x + coverage(s, S.tackleT - CLOSE, S).dx > ts.x + routePos(S.play.target, S.tackleT, S)[0]
  }
  const c = step % 4
  switch (m.frame) {
    case undefined: return { pose: null, flip, moving }
    // Not moving: back to the starting pose, except nobody drops back into a three-point stance mid-play.
    case 'run': return { pose: moving ? (`run${c}` as Pose) : s.pose === 'stance' ? 'stand' : null, flip, moving }
    case 'carry': return { pose: moving ? (`carry${c}` as Pose) : 'hold', flip, moving }
    case 'reach': return { pose: `reach${c}` as Pose, flip, moving }
    case 'hold': return { pose: moving ? (`holdrun${c}` as Pose) : 'hold', flip, moving }
    default: return { pose: m.frame, flip, moving: false }
  }
}

// ---------------------------------------------------------------- projection

const PERSPECTIVE = 520
const TILT = (62 * Math.PI) / 180
const COS = Math.cos(TILT)
const SIN = Math.sin(TILT)

interface Layout { W: number; H: number; top: number; yard: number; depthUnit: number; d0: number; px: number }

const NEAREST_Z = Math.max(...[...OFFENSE, ...DEFENSE].map((s) => s.z)) + 2

/** Screen position and scale for a turf point x yards from the camera (ux = extra sprite px along the field). */
function project(L: Layout, x: number, z: number, ux = 0) {
  const d = L.d0 + z * L.depthUnit
  const k = PERSPECTIVE / (PERSPECTIVE - d * SIN)
  return { sx: L.W / 2 + (x * L.yard + ux * L.px) * k, sy: L.top + d * COS * k, k }
}

function layout(): Layout {
  const W = window.innerWidth
  const H = window.innerHeight
  const fieldH = 0.46 * H // .field-perspective height
  const L: Layout = {
    W, H,
    top: H - fieldH,
    // Phones get a little extra room per yard so the teams don't overlap.
    yard: Math.max(0.014 * W, 0.0125 * H),
    depthUnit: 0.023 * fieldH,
    d0: 0.39 * fieldH, // how far "down" the turf the formation stands
    px: Math.max(1.6, 0.0047 * fieldH * Math.min(1.45, Math.max(1, W / 700))),
  }
  // On short screens the home buttons cover the near side of the field, so pull
  // the formation back (and tighten it) until the nearest player stands above them.
  const buttons = document.querySelector('.home-actions')?.getBoundingClientRect().top
  if (buttons) {
    const base = { d0: L.d0, depthUnit: L.depthUnit }
    for (let f = 1; f >= 0.45 && project(L, 0, NEAREST_Z).sy > buttons + 4; f -= 0.05) {
      L.d0 = base.d0 * f
      L.depthUnit = base.depthUnit * (0.5 + f / 2)
    }
  }
  return L
}

// Built once everything it depends on (routes, tackle constants) is defined.
const DRIVE = buildDrive()

// ---------------------------------------------------------------- camera

/** Which play is on at global time T, and the local time within it. */
function playAt(T: number): { S: Sched; t: number } {
  const { plays } = DRIVE
  for (let i = plays.length - 1; i >= 0; i--) if (T >= plays[i].start) return { S: plays[i], t: T - plays[i].start }
  return { S: plays[0], t: T }
}

/** Camera center (field x). Sits a few yards ahead of the line and follows the ball downfield. */
function cameraAt(T: number): number {
  const { S, t } = playAt(T)
  const base = (P: Sched) => P.los + 4
  const follow = (P: Sched, lt: number) => {
    const bx = P.los + ballAt(Math.min(lt, P.end), P)[0]
    return base(P) + 0.75 * Math.max(0, bx - base(P) - 6)
  }
  if (t <= S.end) return follow(S, t)
  // Between plays: pan to the next line of scrimmage (or back to the start of the drive).
  const next = DRIVE.plays[S.index + 1] ?? DRIVE.plays[0]
  return lerp(follow(S, S.end), base(next), prog(t, S.end, S.end + PAN))
}

// ---------------------------------------------------------------- the field

const TURF = ['#124224', '#103b20'] // stadium turf stripes, pre-dimmed to match the backdrop
const ENDZONE = '#6e1d23'
const LINE = 'rgba(205, 205, 196, 0.42)'

/** SVG for the visible part of the field, given the camera. */
function fieldSvg(L: Layout, cam: number, S: Sched, markers: number): string {
  // Visible depth: from the far edge (top of the turf) to just past the bottom of the screen.
  const yNear = L.H - L.top + 30
  const dNear = (PERSPECTIVE * yNear) / (PERSPECTIVE * COS + yNear * SIN)
  const zFar = -L.d0 / L.depthUnit
  const zNear = (dNear - L.d0) / L.depthUnit
  const quad = (x0: number, x1: number, fill: string, opacity = 1) => {
    const a = project(L, x0 - cam, zFar), b = project(L, x1 - cam, zFar)
    const c = project(L, x1 - cam, zNear), d = project(L, x0 - cam, zNear)
    return `<polygon points="${a.sx.toFixed(1)},${a.sy.toFixed(1)} ${b.sx.toFixed(1)},${b.sy.toFixed(1)} ${c.sx.toFixed(1)},${c.sy.toFixed(1)} ${d.sx.toFixed(1)},${d.sy.toFixed(1)}" fill="${fill}"${opacity < 1 ? ` opacity="${opacity.toFixed(2)}"` : ''}/>`
  }
  const span = (L.W / 2 / L.yard) * 1.6 + 10
  const from = Math.floor((cam - span) / 5) * 5
  const to = cam + span
  let out = ''
  for (let x = from; x < to; x += 5) {
    const inEndzone = x >= 100 || x < 0
    out += quad(x, x + 5, inEndzone ? ENDZONE : TURF[((x / 5) % 2 + 2) % 2])
  }
  for (let x = Math.max(0, from); x <= Math.min(100, to); x += 5) {
    const goal = x === 0 || x === 100
    out += quad(x - (goal ? 0.25 : 0.12), x + (goal ? 0.25 : 0.12), goal ? 'rgba(235, 232, 220, 0.75)' : LINE)
  }
  if (markers > 0) {
    out += quad(S.los - 0.2, S.los + 0.2, '#3a8fe0', 0.85 * markers) // line of scrimmage
    if (S.los + 10 < 100) out += quad(S.los + 9.8, S.los + 10.2, '#f2c230', 0.85 * markers) // line to gain
  }
  return out
}

// ---------------------------------------------------------------- component

interface Actor { spot: Spot; team: TeamColors; flip: boolean }
const ACTORS: Actor[] = [
  ...OFFENSE.map((spot) => ({ spot, team: GOLD, flip: false })),
  ...DEFENSE.map((spot) => ({ spot, team: CRIMSON, flip: true })),
]

export function Teams() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const turf = el.querySelector<SVGGElement>('.turf-g')!
    const cast = el.querySelector<HTMLElement>('.players')!
    const players = Array.from(el.querySelectorAll<HTMLElement>('.pl:not(.pl-ball)'))
    const ball = el.querySelector<HTMLElement>('.pl-ball')!
    const svg = el.querySelector<SVGSVGElement>('.turf-svg')!
    const still = reducedMotion()
    const view = { L: layout() }
    const onResize = () => { view.L = layout() }
    window.addEventListener('resize', onResize)

    // Per-player stride counters for the run cycle (reset every play).
    const steps = players.map(() => ({ dist: 0, last: null as null | [number, number] }))
    const state = { raf: 0, play: -1, cheeredAt: -1 }
    const t0 = performance.now()

    const frame = (now: number) => {
      const L = view.L
      // Dev only: set window.__teamsT = seconds to freeze the drive at one moment (for screenshots).
      const frozen = import.meta.env.DEV ? (window as { __teamsT?: number }).__teamsT : undefined
      const T = frozen ?? (still ? 0 : ((now - t0) / 1000) % DRIVE.loop)
      const { S, t } = playAt(T)
      const cam = still ? S.los + 4 : cameraAt(T)
      const shown = still ? 1 : Math.min(clamp01(t / FADE), clamp01((S.end - t) / FADE))

      svg.setAttribute('viewBox', `0 0 ${L.W} ${L.H}`)
      turf.innerHTML = fieldSvg(L, cam, S, shown)
      cast.style.opacity = String(shown)

      if (state.play !== S.index) {
        state.play = S.index
        steps.forEach((s) => { s.dist = 0; s.last = null })
      }
      // Touchdown: the crowd on the backdrop goes wild once per drive.
      if (S.td && t >= S.whistle && state.cheeredAt !== Math.floor((now - t0) / 1000 / DRIVE.loop) && !frozen) {
        state.cheeredAt = Math.floor((now - t0) / 1000 / DRIVE.loop)
        fx.crowd('cheer', 3, CELEBRATE * 1000)
      }

      players.forEach((p, i) => {
        const a = ACTORS[i]
        const m = move(a.spot, t, S)
        const x = a.spot.x + m.dx
        const z = a.spot.z + m.dz
        const st = steps[i]
        if (st.last) st.dist += Math.hypot(x - st.last[0], z - st.last[1])
        st.last = [x, z]
        const f = pose(a.spot, t, S, Math.floor(st.dist / STRIDE), a.flip)
        const { sx, sy, k } = project(L, S.los + x - cam, z, m.ux)
        const lift = (m.lift ?? 0) * L.px * k
        p.style.transform = `translate(${sx.toFixed(1)}px, ${(sy - lift).toFixed(1)}px) scale(${(k * L.px).toFixed(3)}) translate(-50%, -100%)`
        // Defense draws over offense at the same depth, so engaged pairs layer consistently.
        p.style.zIndex = String(Math.round(sy) * 2 + (a.flip ? 1 : 0) + (m.onTop ? 6 : 0))
        const key = f.pose ?? 'base'
        if (p.dataset.frame !== key) {
          p.querySelector<HTMLElement>(`img[data-f="${p.dataset.frame ?? 'base'}"]`)?.style.setProperty('opacity', '0')
          p.querySelector<HTMLElement>(`img[data-f="${key}"]`)?.style.setProperty('opacity', '1')
          p.dataset.frame = key
        }
        p.classList.toggle('moving', f.moving)
        p.classList.toggle('flip', f.flip)
      })

      const [bx, bz, bux, blift] = ballAt(t, S)
      const b = project(L, S.los + bx - cam, bz, bux)
      const flying = t > S.throwT && t < S.catchT
      const spin = flying ? -25 + 50 * ((t - S.throwT) / (S.catchT - S.throwT)) : 0
      ball.style.visibility = ballLoose(t, S) ? 'visible' : 'hidden'
      ball.style.transform = `translate(${b.sx.toFixed(1)}px, ${(b.sy - blift * L.px * b.k).toFixed(1)}px) scale(${(b.k * L.px).toFixed(3)}) rotate(${spin.toFixed(0)}deg) translate(-50%, -50%)`
      ball.style.zIndex = String(flying || (t > SNAP && t < SNAP + SNAP_FLIGHT) ? 99999 : Math.round(b.sy) * 2 + 2)

      if (!still) state.raf = requestAnimationFrame(frame)
    }
    state.raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(state.raf); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <div className="teams" ref={root} aria-hidden="true">
      <svg className="turf-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="turf-fog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#050a07" stopOpacity="1" />
            <stop offset="0.12" stopColor="#050a07" stopOpacity="0" />
            <stop offset="0.7" stopColor="#050a07" stopOpacity="0" />
            <stop offset="1" stopColor="#050a07" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <g className="turf-g" />
        <rect className="turf-fog" x="0" y="54%" width="100%" height="46%" fill="url(#turf-fog)" />
      </svg>
      <div className="players">
        {ACTORS.map((a, i) => {
          const base = spriteUrl(a.spot.pose, a.team, a.spot.skin)
          return (
            <div key={i} className={`pl ${a.flip ? 'flip' : ''} ${i % 2 ? 'bob-b' : 'bob-a'}`} data-frame="base" style={{ width: base.w, height: base.h }}>
              <img src={base.url} alt="" data-f="base" draggable={false} />
              {FRAMES[a.spot.role].map((f) => {
                const s = spriteUrl(f, a.team, a.spot.skin)
                // Frames can differ in size; keep each one centered on the player's feet.
                return <img key={f} src={s.url} alt="" data-f={f} draggable={false}
                  style={{ width: s.w, height: s.h, left: '50%', top: 'auto', bottom: 0, marginLeft: -s.w / 2 }} />
              })}
            </div>
          )
        })}
        <div className="pl pl-ball" style={{ width: 7, height: 4 }}>
          <svg viewBox="0 0 7 4" width="7" height="4" shapeRendering="crispEdges">
            <rect x="1" y="0" width="5" height="4" fill="#8a4a24" />
            <rect x="0" y="1" width="7" height="2" fill="#8a4a24" />
            <rect x="2" y="1" width="3" height="1" fill="#f2efe4" />
          </svg>
        </div>
      </div>
    </div>
  )
}
