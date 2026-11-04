import { useEffect, useRef } from 'react'
import { reducedMotion } from '../lib/fx'
import { CRIMSON, GOLD, spriteUrl, type Pose, type TeamColors } from './sprites'

// Two teams lined up at the 50 on the home-page field, seen from the sideline.
// Gold (offense) on the left faces right; crimson (defense) on the right faces
// left. Every loop they run one pass play: snap, QB drop, receivers go deep,
// a throw to the far receiver, then the scene fades and resets.
//
// The turf is a CSS 3D plane, but 3D transforms blur pixel art, so players are
// placed in 2D using the same perspective math as the turf (.field-perspective:
// perspective 520px, rotateX 62deg). That keeps every sprite pixel crisp.
//
// Positions are in yards: x along the field (0 = line of scrimmage, + = toward
// the defense), z across it (0 = middle of the formation, + = nearer the camera).

type Role = 'ol' | 'te' | 'qb' | 'rb' | 'wr' | 'wrFar' | 'dl' | 'lb' | 'cb' | 'cbFar' | 'saf'
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
  { x: -1.5, z: 6.5, pose: 'ready', role: 'wr', skin: 4 },
]

const DEFENSE: Spot[] = [
  { x: 1.2, z: -1.8, pose: 'stance', role: 'dl', skin: 4 },
  { x: 1.2, z: -0.6, pose: 'stance', role: 'dl', skin: 2 },
  { x: 1.2, z: 0.6, pose: 'stance', role: 'dl', skin: 3 },
  { x: 1.2, z: 1.8, pose: 'stance', role: 'dl', skin: 0 },
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

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 2)
/** Progress from a to b seconds, eased. */
const prog = (t: number, a: number, b: number) => ease((t - a) / (b - a))
const lin = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))

/** How far each role has moved (yards) at time t in the loop. */
function offset(role: Role, t: number): [number, number] {
  if (t < SNAP) return [0, 0]
  const live = t < WHISTLE ? 1 : 0
  switch (role) {
    case 'ol': return [0.6 * prog(t, SNAP, SNAP + 0.7) + 0.12 * Math.sin(t * 11) * live, 0]
    case 'te': return [5 * prog(t, SNAP, WHISTLE), 3 * prog(t, SNAP, WHISTLE)]
    case 'dl': return [-0.5 * prog(t, SNAP, SNAP + 0.5) - 0.12 * Math.sin(t * 11) * live, 0]
    case 'qb': return [-3 * prog(t, SNAP, SNAP + 1.1), 0]
    case 'rb': return [-1 * prog(t, SNAP, SNAP + 1), -1.2 * prog(t, SNAP, SNAP + 1)]
    case 'wr': case 'wrFar': return [14 * lin(t, SNAP, WHISTLE), 0]
    case 'cb': case 'cbFar': return [12 * lin(t, SNAP + 0.25, WHISTLE), 0]
    case 'lb': return [3 * prog(t, SNAP, SNAP + 2.2), 0]
    case 'saf': return [5 * prog(t, SNAP, WHISTLE), -6.5 * prog(t, SNAP, WHISTLE)]
  }
}

/** These switch to the running frame while the play is live. */
const RUNNERS = new Set<Role>(['wr', 'wrFar', 'cb', 'cbFar', 'saf', 'te'])

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

/** Screen position and scale for a point on the turf. */
function project(L: Layout, x: number, z: number) {
  const d = L.d0 + z * L.depthUnit
  const k = PERSPECTIVE / (PERSPECTIVE - d * SIN)
  return { sx: L.W / 2 + x * L.yard * k, sy: L.top + d * COS * k, k }
}

interface Actor { spot: Spot; team: TeamColors; flip: boolean }
const ACTORS: Actor[] = [
  ...OFFENSE.map((spot) => ({ spot, team: GOLD, flip: false })),
  ...DEFENSE.map((spot) => ({ spot, team: CRIMSON, flip: true })),
]
const QB = OFFENSE.find((s) => s.role === 'qb')!
const TARGET = OFFENSE.find((s) => s.role === 'wrFar')!

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
      const t = still ? 0 : ((now - t0) / 1000) % LOOP
      el.style.opacity = String(still ? 1 : Math.min(clamp01(t / 0.5), clamp01((LOOP - t) / 0.8)))
      players.forEach((p, i) => {
        const a = ACTORS[i]
        const [dx, dz] = offset(a.spot.role, t)
        const { sx, sy, k } = project(L, a.spot.x + dx, a.spot.z + dz)
        p.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${(k * L.px).toFixed(3)}) translate(-50%, -100%)`
        p.style.zIndex = String(Math.round(sy))
        p.classList.toggle('running', RUNNERS.has(a.spot.role) && t > SNAP && t < WHISTLE)
      })
      // The pass: from the QB's drop spot to where the far receiver is at the catch.
      if (!still && t > THROW && t < CATCH) {
        const f = (t - THROW) / (CATCH - THROW)
        const fromX = QB.x - 3
        const toX = TARGET.x + offset('wrFar', CATCH)[0]
        const { sx, sy, k } = project(L, fromX + (toX - fromX) * f, QB.z + (TARGET.z - QB.z) * f)
        const lift = (12 + 24 * Math.sin(Math.PI * f)) * L.px * k
        ball.style.opacity = '1'
        ball.style.transform = `translate(${sx.toFixed(1)}px, ${(sy - lift).toFixed(1)}px) scale(${(k * L.px).toFixed(3)}) rotate(${(-25 + 50 * f).toFixed(0)}deg) translate(-50%, -50%)`
      } else {
        ball.style.opacity = '0'
      }
      if (!still) loop.raf = requestAnimationFrame(frame)
    }
    loop.raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(loop.raf); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <div className="teams" ref={root} aria-hidden="true">
      {ACTORS.map((a, i) => {
        const base = spriteUrl(a.spot.pose, a.team, a.spot.skin)
        const run = RUNNERS.has(a.spot.role) ? spriteUrl('run', a.team, a.spot.skin) : null
        return (
          <div key={i} className={`pl ${a.flip ? 'flip' : ''} ${i % 2 ? 'bob-b' : 'bob-a'}`} style={{ width: base.w, height: base.h }}>
            <img src={base.url} alt="" className="f-base" draggable={false} />
            {run && <img src={run.url} alt="" className="f-run" draggable={false} />}
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
