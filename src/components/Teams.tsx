import { useEffect, useRef } from 'react'
import { reducedMotion } from '../lib/fx'
import { CRIMSON, GOLD, spriteUrl, type Pose, type TeamColors } from './sprites'

// Two teams lined up at the 50 on the home-page field, seen from the sideline.
// Gold (offense) on the left faces right; crimson (defense) on the right faces
// left. Every loop they run one pass play: the center snaps the ball back to
// the QB in the shotgun, the lines rise out of their stances and lock up face
// to face, the QB drops with the ball at his chest, winds up, throws and
// follows through, the near receiver reaches up, makes the catch and tucks
// it as he runs, then the scene fades and resets.
//
// The turf is a CSS 3D plane, but 3D transforms blur pixel art, so players are
// placed in 2D using the same perspective math as the turf (.field-perspective:
// perspective 520px, rotateX 62deg). That keeps every sprite pixel crisp.
//
// Positions are in yards: x along the field (0 = line of scrimmage, + = toward
// the defense), z across it (0 = middle of the formation, + = nearer the camera).

type Role = 'ol' | 'te' | 'qb' | 'rb' | 'wr' | 'wrFar' | 'wrNear' | 'dl' | 'lb' | 'cb' | 'cbFar' | 'saf'
interface Spot { x: number; z: number; pose: Pose; role: Role; skin: number }

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
  { x: -1.8, z: -5.5, pose: 'ready', role: 'wr', skin: 2 },
  { x: -1.5, z: 6.5, pose: 'ready', role: 'wrNear', skin: 4 }, // the target
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
  { x: 5.2, z: -5.5, pose: 'ready', role: 'cb', skin: 0 },
  { x: 6, z: 6.5, pose: 'ready', role: 'cb', skin: 4 },
  { x: 10, z: -1.5, pose: 'stand', role: 'saf', skin: 1 },
]

const LOOP = 11 // seconds
const SNAP = 0.45 * LOOP
const WHISTLE = 0.8 * LOOP
const THROW = 0.62 * LOOP
const CATCH = 0.74 * LOOP
const SNAP_FLIGHT = 0.32 // seconds for the shotgun snap to reach the QB
const WINDUP = 0.3 // seconds the QB spends cocking the ball before release
const FOLLOW = 0.7 // seconds of follow-through after release
const REACH = 0.35 // seconds the receiver reaches for the ball before it arrives

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 2)
/** Progress from a to b seconds, eased. */
const prog = (t: number, a: number, b: number) => ease((t - a) / (b - a))
const lin = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))

/** Sprite columns between an engaged lineman's center and the line of scrimmage. */
const ENGAGE = 5
const LOCK = 0.3 // seconds for the lines to come out of their stances and meet

type Frame = 'run' | 'block' | 'hold' | 'windup' | 'follow' | 'reach' | 'carry'

interface Move {
  dx: number // yards along the field
  dz: number // yards across the field
  ux?: number // extra sprite pixels along the field (for linemen meeting exactly)
  frame?: Frame
}

/** Where each player is relative to his starting spot at time t in the loop. */
function move(s: Spot, t: number): Move {
  if (t < SNAP) return { dx: 0, dz: 0 }
  const live = t < WHISTLE ? 1 : 0
  switch (s.role) {
    case 'ol': case 'dl': {
      // Both lines fire out and meet at the ball, then push and pull together.
      const side = s.role === 'ol' ? -1 : 1
      const e = prog(t, SNAP, SNAP + LOCK)
      const drive = 1.6 * prog(t, SNAP + LOCK, WHISTLE)
      const tussle = 0.9 * Math.sin(t * 7 + s.z * 2.3) * live * e
      const help = s.role === 'ol' && s.z < -2 ? 0.6 * e : 0 // the uncovered guard helps inside
      return { dx: -s.x * e, dz: help, ux: side * ENGAGE * e + drive + tussle, frame: t > SNAP + 0.08 ? 'block' : undefined }
    }
    case 'te': return { dx: 5 * prog(t, SNAP, WHISTLE), dz: 3 * prog(t, SNAP, WHISTLE), frame: live ? 'run' : undefined }
    // Ball at his chest from the snap, then windup, release, and a step into the follow-through.
    case 'qb': {
      const frame: Frame | undefined =
        t < SNAP + SNAP_FLIGHT ? undefined
        : t < THROW - WINDUP ? 'hold'
        : t < THROW ? 'windup'
        : t < THROW + FOLLOW ? 'follow'
        : undefined
      return { dx: -3 * prog(t, SNAP + 0.25, SNAP + 1.3) + 0.5 * prog(t, THROW - 0.1, THROW + 0.4), dz: 0, frame }
    }
    // Runs his route, reaches up as the ball arrives, catches it, tucks it and keeps going.
    case 'wrNear': {
      const frame: Frame | undefined =
        t < CATCH - REACH ? 'run'
        : t < CATCH + 0.15 ? 'reach'
        : t < WHISTLE ? 'carry'
        : 'hold'
      return { dx: 14 * lin(t, SNAP, WHISTLE), dz: 0, frame }
    }
    case 'rb': return { dx: 0.6 * prog(t, SNAP, SNAP + 0.8), dz: -1.1 * prog(t, SNAP, SNAP + 0.8), frame: t > SNAP + 0.5 ? 'block' : undefined }
    case 'wr': case 'wrFar': return { dx: 14 * lin(t, SNAP, WHISTLE), dz: 0, frame: live ? 'run' : undefined }
    case 'cb': case 'cbFar': return { dx: 12 * lin(t, SNAP + 0.25, WHISTLE), dz: 0, frame: live && t > SNAP + 0.25 ? 'run' : undefined }
    case 'lb': return { dx: 3 * prog(t, SNAP, SNAP + 2.2), dz: 0 }
    case 'saf': return { dx: 5 * prog(t, SNAP, WHISTLE), dz: -6.5 * prog(t, SNAP, WHISTLE), frame: live ? 'run' : undefined }
  }
}

/** Extra sprite frames each role switches between during the play. */
const FRAMES: Partial<Record<Role, Frame[]>> = {
  wr: ['run'], wrFar: ['run'], cb: ['run'], cbFar: ['run'], saf: ['run'], te: ['run'],
  ol: ['block'], dl: ['block'], rb: ['block'],
  qb: ['hold', 'windup', 'follow'],
  wrNear: ['run', 'reach', 'carry', 'hold'],
}

// Perspective of the turf (.field-perspective / .field-plane in index.css).
const PERSPECTIVE = 520
const TILT = (62 * Math.PI) / 180
const COS = Math.cos(TILT)
const SIN = Math.sin(TILT)

interface Layout { W: number; top: number; yard: number; depthUnit: number; d0: number; px: number }

const NEAREST_Z = Math.max(...[...OFFENSE, ...DEFENSE].map((s) => s.z))

function layout(): Layout {
  const W = window.innerWidth
  const H = window.innerHeight
  const fieldH = 0.46 * H // .field-perspective height
  const L: Layout = {
    W,
    top: H - fieldH,
    // A yard matches the turf's yard lines (every 10% of a 140%-wide plane) on
    // wide screens; phones get a little extra room so the teams don't overlap.
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

/** Screen position and scale for a point on the turf (ux = extra sprite pixels along the field). */
function project(L: Layout, x: number, z: number, ux = 0) {
  const d = L.d0 + z * L.depthUnit
  const k = PERSPECTIVE / (PERSPECTIVE - d * SIN)
  return { sx: L.W / 2 + (x * L.yard + ux * L.px) * k, sy: L.top + d * COS * k, k }
}

interface Actor { spot: Spot; team: TeamColors; flip: boolean }
const ACTORS: Actor[] = [
  ...OFFENSE.map((spot) => ({ spot, team: GOLD, flip: false })),
  ...DEFENSE.map((spot) => ({ spot, team: CRIMSON, flip: true })),
]
const QB = OFFENSE.find((s) => s.role === 'qb')!
const CENTER = OFFENSE.find((s) => s.role === 'ol' && s.z === 0)!
const TARGET = OFFENSE.find((s) => s.role === 'wrNear')!

/** A point where a player's hands are: [x yards, z yards, ux sprite px, lift sprite px]. */
type BallSpot = [number, number, number, number]
function hands(s: Spot, t: number, ux = 3, lift = 9): BallSpot {
  const m = move(s, t)
  return [s.x + m.dx, s.z + m.dz, (m.ux ?? 0) + ux, lift]
}
const mix = (a: BallSpot, b: BallSpot, f: number): BallSpot => a.map((v, i) => v + (b[i] - v) * f) as BallSpot

/** The ball's whole path: under the center, snapped to the QB, carried on the drop, thrown, caught. */
function ballAt(t: number): BallSpot {
  const atCenter: BallSpot = [CENTER.x, CENTER.z, 6, 0.5]
  if (t < SNAP) return atCenter
  if (t < SNAP + SNAP_FLIGHT) {
    const f = (t - SNAP) / SNAP_FLIGHT
    const p = mix(atCenter, hands(QB, t), f)
    p[3] += 4 * Math.sin(Math.PI * f)
    return p
  }
  if (t < THROW) return hands(QB, t)
  if (t < CATCH) {
    // From the release point above the QB's helmet to the receiver's raised hands.
    const f = (t - THROW) / (CATCH - THROW)
    const p = mix(hands(QB, THROW, 6, 17), hands(TARGET, CATCH, 4, 18), f)
    p[3] += 22 * Math.sin(Math.PI * f)
    return p
  }
  return hands(TARGET, t)
}

export function Teams() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const players = Array.from(el.querySelectorAll<HTMLElement>('.pl:not(.pl-ball)'))
    const ball = el.querySelector<HTMLElement>('.pl-ball')!
    const still = reducedMotion()
    const view = { L: layout() }
    const onResize = () => { view.L = layout() }
    window.addEventListener('resize', onResize)

    const t0 = performance.now()
    const loop = { raf: 0 }
    const frame = (now: number) => {
      const L = view.L
      // Dev only: set window.__teamsT = seconds to freeze the play at one moment (for screenshots).
      const frozen = import.meta.env.DEV ? (window as { __teamsT?: number }).__teamsT : undefined
      const t = frozen ?? (still ? 0 : ((now - t0) / 1000) % LOOP)
      el.style.opacity = String(still ? 1 : Math.min(clamp01(t / 0.5), clamp01((LOOP - t) / 0.8)))
      players.forEach((p, i) => {
        const a = ACTORS[i]
        const m = move(a.spot, t)
        const { sx, sy, k } = project(L, a.spot.x + m.dx, a.spot.z + m.dz, m.ux)
        p.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${(k * L.px).toFixed(3)}) translate(-50%, -100%)`
        // Defense draws over offense at the same depth, so engaged pairs layer consistently.
        p.style.zIndex = String(Math.round(sy) * 2 + (a.flip ? 1 : 0))
        if (p.dataset.frame !== (m.frame ?? '')) p.dataset.frame = m.frame ?? ''
      })
      const [bx, bz, bux, lift] = ballAt(t)
      const b = project(L, bx, bz, bux)
      const flying = t > THROW && t < CATCH
      // While the QB or the receiver holds it, the ball is part of their sprite.
      ball.style.visibility = (t >= SNAP + SNAP_FLIGHT && t < THROW) || t >= CATCH ? 'hidden' : 'visible'
      const spin = flying ? -25 + 50 * ((t - THROW) / (CATCH - THROW)) : 0
      ball.style.transform = `translate(${b.sx.toFixed(1)}px, ${(b.sy - lift * L.px * b.k).toFixed(1)}px) scale(${(b.k * L.px).toFixed(3)}) rotate(${spin.toFixed(0)}deg) translate(-50%, -50%)`
      ball.style.zIndex = String(flying || (t > SNAP && t < SNAP + SNAP_FLIGHT) ? 99999 : Math.round(b.sy) * 2 + 2)
      if (!still) loop.raf = requestAnimationFrame(frame)
    }
    loop.raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(loop.raf); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <div className="teams" ref={root} aria-hidden="true">
      {ACTORS.map((a, i) => {
        const base = spriteUrl(a.spot.pose, a.team, a.spot.skin)
        return (
          <div key={i} className={`pl ${a.flip ? 'flip' : ''} ${i % 2 ? 'bob-b' : 'bob-a'}`} style={{ width: base.w, height: base.h }}>
            <img src={base.url} alt="" data-f="base" draggable={false} />
            {(FRAMES[a.spot.role] ?? []).map((f) => {
              const s = spriteUrl(f, a.team, a.spot.skin)
              // Frames can differ in width; keep each one centered on the player's feet.
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
  )
}
