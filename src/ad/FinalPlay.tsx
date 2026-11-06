// "The Final Play": a 9:16 ad for TikTok and Reels, about 23 seconds.
// Play 7 of 7, ball on the opponent 10. A field goal is already locked in,
// so only a Hail Mary answer (+10 yards) scores the touchdown.
//
// Everything on screen is computed from t (seconds). No CSS animations or
// timers, so a recorder can render any frame exactly (see main.tsx).
//
// Facts: in the game's database (prompt 'sb-qb') Tom Brady is Tier 1
// (Checkdown, +1 yd) and Jeff Hostetler is Tier 5 (Hail Mary, +10 yds).
// Hostetler started and won Super Bowl XXV for the Giants.

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { CRIMSON, GOLD, spriteUrl, type Pose, type TeamColors } from '../components/sprites'
import { TIERS } from '../engine/tiers'
import { announcerUrl, COLOR, PBP, type BoothPose } from './booth'
import { clockAt, DURATION, LINES, T } from './timeline'

const SPEAKER = { PBP: 'PLAY-BY-PLAY', COLOR: 'COLOR' }

const W = 432
const H = 768

// ---------- Helpers ----------
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const easeBack = (p: number) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2) }
const within = (t: number, a: number, b: number) => t >= a && t < b
const rnd = (i: number, n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1

function typed(text: string, t: number, start: number, cps = 30): string {
  return text.slice(0, Math.max(0, Math.floor((t - start) * cps)))
}

function inputText(t: number): string {
  const brady = 'Tom Br'
  if (t < T.typeBrady) return ''
  if (t < T.deleteBrady) return brady.slice(0, Math.min(brady.length, Math.floor((t - T.typeBrady) * 10) + 1))
  if (t < T.typeHoss) return brady.slice(0, Math.max(0, brady.length - Math.floor((t - T.deleteBrady) * 20)))
  const hoss = 'Jeff Hostetler'
  return hoss.slice(0, Math.min(hoss.length, Math.floor((t - T.typeHoss) * 13) + 1))
}

/** Cheering level for the stands and lights: 0 calm, 1-3 louder. */
function cheer(t: number): number {
  if (within(t, T.reveal, T.throwSnap)) return 2
  if (within(t, T.catch, T.endCard)) return 3
  if (t >= T.endCard) return 1
  return 0
}

// ---------- Stadium backdrop ----------
const BULBS = Array.from({ length: 30 }, (_, i) => ({
  left: rnd(i, 1) * 100, top: rnd(i, 2) * 100, phase: rnd(i, 3), dur: 6 + rnd(i, 4) * 7,
}))

function lightsLevel(t: number): number {
  if (t < T.lightsOn) return 0
  if (t < 0.33) return 1
  if (t < 0.42) return 0.15
  if (t < 0.5) return 1
  if (t < 0.55) return 0.3
  return 1
}

function Stadium({ t }: { t: number }) {
  const lv = lightsLevel(t)
  const c = cheer(t)
  const dark = t >= T.endCard ? 0.4 : c === 3 ? 0.28 : c === 2 ? 0.5 : t < T.fieldIn ? 0.55 : 0.72
  const jump = c ? Math.abs(Math.sin(t * (c === 3 ? 16 : 12))) * (c === 3 ? 7 : 4) : 0
  const flashSpeed = c === 3 ? 7 : c === 2 ? 4 : 1
  return (
    <div className="stadium ad-stadium">
      <div className="sky" />
      <div className="ad-beam left" style={{ opacity: lv * 0.9, transform: `rotate(${Math.sin(t * 0.6) * 2.5}deg)` }} />
      <div className="ad-beam right" style={{ opacity: lv * 0.9, transform: `rotate(${-Math.sin(t * 0.5 + 1) * 2.5}deg)` }} />
      <div className="lights left" style={{ opacity: lv, filter: `blur(2px) brightness(${c ? 1.35 : 1})` }} />
      <div className="lights right" style={{ opacity: lv, filter: `blur(2px) brightness(${c ? 1.35 : 1})` }} />
      <div className="crowd" style={{ opacity: lv * (c ? 1 : 0.8), transform: `translateY(${-jump}px)`, filter: c ? `brightness(${c === 3 ? 2.4 : 1.8}) saturate(1.4)` : undefined }}>
        {BULBS.map((b, i) => {
          const cyc = ((t * flashSpeed) / b.dur + b.phase) % 1
          const o = lv < 1 ? 0 : cyc > 0.96 && cyc < 0.985 ? 1 - (cyc - 0.96) / 0.025 : 0
          return <span key={i} className="flashbulb" style={{ left: `${b.left}%`, top: `${b.top}%`, opacity: o, transform: `scale(${0.4 + o})` }} />
        })}
      </div>
      <div className="field-perspective" style={{ opacity: lv }}>
        <div className="field-plane" />
      </div>
      <div className="ad-dim" style={{ opacity: dark }} />
    </div>
  )
}

// ---------- Scoreboard + field strip (same markup and classes as the game) ----------
const PREV_TIERS = [4, 2, 5, 3, 2, 5] as const // 8+3+10+6+3+10 = 40 yards: ball on the opponent 10

function Board({ t }: { t: number }) {
  const p = prog(t, T.boardIn, T.boardIn + 0.35)
  const score = Math.round(lerp(400, 500, easeOut(prog(t, T.reveal + 0.2, T.reveal + 1.1))) / 10) * 10
  const toGoal = lerp(10, 0, easeInOut(prog(t, T.release, T.catch)))
  const ballText = toGoal <= 0.01 ? 'END ZONE' : 'OPP 10'
  const scored7 = t >= T.reveal
  const pulse = 0.5 + 0.5 * Math.sin(t * 5.2)
  const pct = (y: number) => ((52 - y) / 62) * 100
  return (
    <div className="ad-board" style={{ opacity: p, transform: `translateY(${(1 - easeOut(p)) * -16}px)` }}>
      <header className="scoreboard">
        <div className="sb-box">
          <span className="sb-label">BALL ON</span>
          <span className="led led-sm" style={{ whiteSpace: 'nowrap', fontSize: toGoal <= 0.01 ? 19 : undefined }}>{ballText}</span>
        </div>
        <div className="sb-center">
          <div className="bulbs">
            {[...PREV_TIERS, scored7 ? 5 : 0].map((tier, i) => {
              const color = tier ? TIERS[tier as 1 | 2 | 3 | 4 | 5].color : undefined
              const active = !tier
              return (
                <span
                  key={i}
                  className={`bulb ${tier ? 'done' : ''}`}
                  style={color
                    ? { background: color, boxShadow: `0 0 8px ${color}` }
                    : active ? { background: '#3b2a06', boxShadow: `0 0 0 2px var(--amber), 0 0 ${2 + pulse * 8}px rgba(255, 182, 39, 0.6)` } : undefined}
                />
              )
            })}
          </div>
          <span className="sb-label">PLAY 7 OF 7</span>
        </div>
        <div className="sb-box right">
          <span className="sb-label">SCORE</span>
          <span className="led">{score}</span>
        </div>
      </header>
      <div className={`field-strip compact ${toGoal <= 0.01 ? 'in-endzone' : ''}`}>
        <div className="turf ad-turf">
          {[50, 40, 30, 20, 10].map((m) => (
            <div key={m} className="yard-line" style={{ left: `${pct(m)}%` }}><span>{m}</span></div>
          ))}
          <div className="fg-line" style={{ left: `${pct(35)}%` }}><span>FG RANGE</span></div>
          <div className="endzone" style={{ left: `${pct(0)}%`, filter: toGoal <= 0.01 ? 'brightness(1.5)' : undefined }}><span>END ZONE</span></div>
          <div className="ball-marker" style={{ left: `${pct(toGoal)}%`, transform: `translate(-50%, -50%) rotate(${t >= T.release && t < T.catch ? (t - T.release) * 1400 : 0}deg)` }}>
            <svg viewBox="0 0 28 16" aria-hidden="true">
              <ellipse cx="14" cy="8" rx="13" ry="7.2" fill="#8a4a24" stroke="#3b1d0c" strokeWidth="1.2" />
              <path d="M7 8 H21" stroke="#fff" strokeWidth="1.3" />
              <path d="M10 6 V10 M12.6 6 V10 M15.3 6 V10 M18 6 V10" stroke="#fff" strokeWidth="1.1" />
            </svg>
          </div>
          <div className="scrimmage" style={{ left: `${pct(10)}%` }} />
        </div>
      </div>
    </div>
  )
}

// ---------- Opening hook ----------
function Hook({ t }: { t: number }) {
  if (t < T.hookIn || t > T.hookOut + 0.3) return null
  // The board flickers on like a real scoreboard, then pulls away.
  const flick = t < T.hookIn + 0.08 ? 0.4 : t < T.hookIn + 0.14 ? 0.1 : 1
  const out = prog(t, T.hookOut, T.hookOut + 0.25)
  const line = prog(t, 1.0, 1.25)
  return (
    <div className="ad-hook" style={{ opacity: flick * (1 - out), transform: `scale(${1 - out * 0.08})` }}>
      <div className="ad-hook-board">
        <span className="sb-label ad-hook-small">PLAY 7 OF 7</span>
        <span className="led ad-hook-big">4TH &amp; LONG</span>
        <span className="led ad-hook-mid">BALL ON THE 10</span>
      </div>
      <p className="ad-hook-line" style={{ opacity: line, transform: `translateY(${(1 - easeOut(line)) * 12}px)` }}>
        Final play of<br />today's drive.
      </p>
    </div>
  )
}

// ---------- Pixel field ----------
const FIELD_TOP = 200
const FIELD_BOT = 482
const PX_YD = 13.5
const fx = (ytg: number) => (22 - ytg) * PX_YD
const fy = (lat: number) => 250 + lat * 210
const SCALE = 3

interface Body { key: string; ytg: number; lat: number; pose: Pose; team: TeamColors; flip: boolean; skin: number; hop?: number }

function lerpPos(a: [number, number], b: [number, number], p: number): [number, number] {
  return [lerp(a[0], b[0], p), lerp(a[1], b[1], p)]
}

function bodies(t: number): Body[] {
  const snapped = t >= T.throwSnap
  const done = t >= T.catch
  const runF = (Math.floor(t * 12) % 4) as 0 | 1 | 2 | 3
  const hop = (k: number) => (done ? Math.abs(Math.sin((t - T.catch) * 9 + k)) * 9 : Math.sin(t * 3 + k) * 0.6)
  const out: Body[] = []
  const O = (key: string, ytg: number, lat: number, pose: Pose, skin: number, h = 0) => out.push({ key, ytg, lat, pose, team: GOLD, flip: false, skin, hop: h })
  const D = (key: string, ytg: number, lat: number, pose: Pose, skin: number, flip = true) => out.push({ key, ytg, lat, pose, team: CRIMSON, flip, skin })

  // Offensive line and tight end
  const ol: [number, number][] = [[10.7, 0.3], [10.7, 0.4], [10.7, 0.5], [10.7, 0.6], [10.7, 0.7], [10.8, 0.8]]
  ol.forEach(([y, l], i) => O(`ol${i}`, snapped && !done ? y + 0.4 : y, l, done ? 'cheer' : snapped ? 'block' : 'stance', i + 1, done ? hop(i) : 0))
  // QB in the shotgun
  const qbPose: Pose = done ? 'cheer' : !snapped ? 'ready' : t < 14.55 ? 'hold' : t < T.release ? 'windup' : 'follow'
  O('qb', snapped ? 15.6 : 15, 0.5, qbPose, 0, done ? hop(9) : 0)
  O('rb', 15, 0.62, done ? 'cheer' : snapped ? 'block' : 'ready', 3, done ? hop(4) : 0)
  // Receivers
  const wr1p = easeInOut(prog(t, T.throwSnap, T.catch - 0.05))
  const [w1y, w1l] = lerpPos([10.7, 0.06], [-5.5, 0.18], wr1p)
  const wr1Pose: Pose = done ? 'cheerball' : !snapped ? 'ready' : t > T.catch - 0.3 ? `reach${runF}` : `run${runF}`
  O('wr1', w1y, w1l, wr1Pose, 4, done ? Math.abs(Math.sin((t - T.catch) * 8)) * 16 : 0)
  const [w2y, w2l] = lerpPos([10.7, 0.96], [-2.5, 0.88], easeInOut(prog(t, T.throwSnap, T.catch)))
  O('wr2', w2y, w2l, done ? 'cheer' : !snapped ? 'ready' : `run${((runF + 2) % 4) as 0 | 1 | 2 | 3}`, 2, done ? hop(2) : 0)

  // Defense
  const dl: [number, number][] = [[9.3, 0.36], [9.3, 0.5], [9.3, 0.64]]
  dl.forEach(([y, l], i) => D(`dl${i}`, snapped && !done ? y - 0.2 : y, l, done ? 'stand' : snapped ? 'block' : 'stance', i + 2))
  const lbP = easeOut(prog(t, T.throwSnap, T.catch))
  D('lb0', lerp(6, 2.5, lbP), 0.28, snapped && !done ? `run${runF}` : 'ready', 1, !snapped || done)
  D('lb1', lerp(6, 2.5, lbP), 0.72, snapped && !done ? `run${((runF + 1) % 4) as 0 | 1 | 2 | 3}` : 'ready', 4, !snapped || done)
  // Corner trailing the target, a step late
  const [c1y, c1l] = lerpPos([9.2, 0.06], [-3.4, 0.24], easeInOut(prog(t, T.throwSnap + 0.08, T.catch + 0.05)))
  D('cb0', c1y, c1l, done ? 'stand' : snapped ? `run${((runF + 3) % 4) as 0 | 1 | 2 | 3}` : 'ready', 0, !snapped)
  D('cb1', lerp(9.2, -1.5, easeInOut(prog(t, T.throwSnap, T.catch))), 0.96, done ? 'stand' : snapped ? `run${runF}` : 'ready', 3, !snapped)
  // Safeties in the end zone, too far to help
  D('s0', lerp(-1, -2, lbP), lerp(0.42, 0.33, lbP), snapped && !done ? `run${runF}` : 'ready', 2)
  D('s1', -1, lerp(0.66, 0.6, lbP), 'ready', 1)
  return out
}

function PixelField({ t }: { t: number }) {
  const showPre = within(t, T.fieldIn, T.cardIn + 0.25)
  const showPlay = within(t, T.throwSnap, T.endCard)
  if (!showPre && !showPlay) return null
  const fadeIn = showPre ? prog(t, T.fieldIn, T.fieldIn + 0.25) : prog(t, T.throwSnap, T.throwSnap + 0.12)
  const fadeOut = showPre ? prog(t, T.cardIn, T.cardIn + 0.25) : prog(t, T.endCard - 0.1, T.endCard)
  const list = bodies(t).sort((a, b) => fy(a.lat) - fy(b.lat))

  // The ball in flight
  let ball: ReactNode = null
  if (within(t, T.release, T.catch)) {
    const p = prog(t, T.release, T.catch)
    const x0 = fx(15.6) + 12, y0 = fy(0.5) - FIELD_TOP - 50
    const x1 = fx(-5.5) + 6, y1 = fy(0.18) - FIELD_TOP - 46
    const at = (q: number) => {
      const xx = lerp(x0, x1, q)
      const yy = lerp(y0, y1, q) - Math.sin(Math.PI * q) * 58
      return [xx, yy]
    }
    const trail = [0.09, 0.06, 0.03].map((d, i) => {
      const [tx, ty] = at(Math.max(0, p - d))
      return <span key={i} className="ad-ball-trail" style={{ left: tx - 6, top: ty - 6, opacity: 0.18 + i * 0.12 }} />
    })
    const [bx, by] = at(p)
    const [nx, ny] = at(Math.min(1, p + 0.01))
    const ang2 = (Math.atan2(ny - by, nx - bx) * 180) / Math.PI
    const spin = Math.floor(t * 30) % 2
    ball = (
      <>
        <div className="ad-ball-shadow" style={{ left: lerp(x0, x1, p) - 8, top: lerp(fy(0.5), fy(0.18), p) - FIELD_TOP - 3 }} />
        {trail}
        <svg className="ad-ball" viewBox="0 0 14 8" style={{ left: bx - 14, top: by - 8, transform: `rotate(${ang2}deg)` }}>
          <ellipse cx="7" cy="4" rx="6.5" ry="3.6" fill="#9a5528" stroke="#3b1d0c" strokeWidth="0.7" />
          <path d={spin ? 'M4.2 4 H9.8' : 'M4.2 3.2 H9.8'} stroke="#f2efe4" strokeWidth="0.7" />
          <path d={spin ? 'M5.5 3.2 V4.8 M7 3.2 V4.8 M8.5 3.2 V4.8' : 'M5.5 2.5 V3.9 M7 2.5 V3.9 M8.5 2.5 V3.9'} stroke="#f2efe4" strokeWidth="0.5" />
        </svg>
      </>
    )
  }

  const stripes: ReactNode[] = []
  for (let y = 25; y > -10; y -= 5) {
    stripes.push(<rect key={`s${y}`} x={fx(y)} y={0} width={5 * PX_YD} height={FIELD_BOT - FIELD_TOP} fill={((y / 5) % 2 === 0) ? '#1d6b3a' : '#195f33'} />)
  }
  const lines = [20, 15, 10, 5].map((y) => <rect key={`l${y}`} x={fx(y) - 1} y={0} width={2} height={FIELD_BOT - FIELD_TOP} fill="rgba(242,239,228,0.7)" />)
  const hashes: ReactNode[] = []
  for (let y = 21; y >= 1; y--) {
    if (y % 5 === 0) continue
    hashes.push(<rect key={`h${y}`} x={fx(y) - 0.5} y={92} width={1.5} height={9} fill="rgba(242,239,228,0.55)" />)
    hashes.push(<rect key={`g${y}`} x={fx(y) - 0.5} y={186} width={1.5} height={9} fill="rgba(242,239,228,0.55)" />)
  }
  const ezOn = t >= T.catch
  // Camera pushes in toward the end zone as the ball is in the air.
  const zoom = showPlay ? 1 + 0.32 * easeInOut(prog(t, T.release - 0.1, T.catch)) - 0.12 * easeOut(prog(t, T.catch + 0.6, T.catch + 1.6)) : 1
  return (
    <div className="ad-field" style={{ opacity: fadeIn * (1 - fadeOut) }}>
      <div className="ad-cam" style={{ transform: `scale(${zoom})`, transformOrigin: `${fx(-4)}px ${fy(0.2) - FIELD_TOP}px` }}>
      <svg className="ad-field-svg" viewBox={`0 0 ${W} ${FIELD_BOT - FIELD_TOP}`} width={W} height={FIELD_BOT - FIELD_TOP}>
        <defs>
          <pattern id="ez" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="14" height="14" fill="#8c1d24" />
            <rect width="7" height="14" fill="#7a1820" />
          </pattern>
        </defs>
        {stripes}
        <rect x={fx(0)} y={0} width={W - fx(0)} height={FIELD_BOT - FIELD_TOP} fill="url(#ez)" style={{ filter: ezOn ? 'brightness(1.45)' : undefined }} />
        {lines}
        {hashes}
        <rect x={fx(0) - 2} y={0} width={4} height={FIELD_BOT - FIELD_TOP} fill="#f2efe4" />
        <text x={fx(20)} y={262} className="ad-yd-num" textAnchor="middle">2 0</text>
        <text x={fx(10)} y={262} className="ad-yd-num" textAnchor="middle">1 0</text>
        <text x={(fx(0) + W) / 2} y={150} className="ad-ez-word" textAnchor="middle" transform={`rotate(-90 ${(fx(0) + W) / 2} 141)`}>4TH &amp; LONG</text>
        {!ezOn && <rect x={fx(10) - 1.5} y={0} width={3} height={FIELD_BOT - FIELD_TOP} fill="#3aa0ff" style={{ filter: 'drop-shadow(0 0 4px #3aa0ff)' }} />}
      </svg>
      <div className="ad-players">
        {list.map((b) => {
          const s = spriteUrl(b.pose, b.team, b.skin)
          const w = s.w * SCALE, h = s.h * SCALE
          const x = fx(b.ytg) - w / 2
          const y = fy(b.lat) - FIELD_TOP - h - (b.hop ?? 0)
          const glow = b.key === 'wr1' && t >= T.catch
          return (
            <div key={b.key}>
              {glow && <span className="ad-glow" style={{ left: fx(b.ytg) - 34, top: fy(b.lat) - FIELD_TOP - 12 }} />}
              <img src={s.url} className="ad-pl" style={{ left: x, top: y, width: w, height: h, transform: b.flip ? 'scaleX(-1)' : undefined }} alt="" />
            </div>
          )
        })}
      </div>
      <div className="ad-ball-layer">{ball}</div>
      </div>
      <div className="ad-field-fade" />
    </div>
  )
}

function Presnap({ t }: { t: number }) {
  if (!within(t, T.ready, T.cardIn + 0.1)) return null
  const word = t < T.set ? 'READY' : t < T.hut ? 'SET' : 'HUT!'
  const start = t < T.set ? T.ready : t < T.hut ? T.set : T.hut
  const p = easeBack(prog(t, start, start + 0.18))
  return (
    <div className="ad-presnap" style={{ opacity: clamp(p), transform: `scale(${0.6 + 0.4 * p})` }}>
      <span className="presnap-word">{word}</span>
    </div>
  )
}

// ---------- Play card ----------
function PlayCard({ t }: { t: number }) {
  const visible = within(t, T.cardIn, T.reveal) && !within(t, T.boothIn, T.boothOut) && !within(t, T.boothNo, T.boothNoOut)
  if (!visible) return null
  const enter = t < T.boothIn ? prog(t, T.cardIn, T.cardIn + 0.35) : t < T.boothNo ? prog(t, T.boothOut, T.boothOut + 0.18) : 1
  const clock = clockAt(t)
  const secs = Math.max(0, Math.ceil(clock - 0.001))
  const urgent = secs <= 5
  const blinkOn = !urgent || Math.floor(t * 2) % 2 === 0
  const text = inputText(t)
  const typing = t >= T.boothOut
  const caret = typing && t < T.snap && Math.floor(t * 2.6) % 2 === 0
  const pressed = within(t, T.snap, T.snap + 0.15)
  const freeze = prog(t, T.freeze, T.freeze + 0.3)
  return (
    <section
      className={`play-card ad-card ${urgent ? 'urgent' : ''}`}
      style={{ opacity: enter, transform: `translateY(${(1 - easeOut(enter)) * 18}px) scale(${1 + freeze * 0.04})` }}
    >
      <div className="play-card-top">
        <span className="tag">DRIVE #4 · PLAY 7</span>
        <span className="tag tag-cat">SUPER BOWL</span>
      </div>
      <h1 className="prompt-text ad-prompt">Name a quarterback who started and won a Super Bowl</h1>
      <div className="clock-row">
        <div className={`play-clock ${urgent ? 'urgent' : ''}`}>
          <span className="sb-label">PLAY CLOCK</span>
          <span className="led" style={{ opacity: blinkOn ? 1 : 0.55 }}>{String(secs).padStart(2, '0')}</span>
        </div>
        <div className="downs">
          <span className="down now">1ST</span>
          <span className="down">2ND</span>
          <span className="down">3RD</span>
          <span className="sb-label">DOWN</span>
        </div>
      </div>
      <div className="clock-bar"><span style={{ transform: `scaleX(${clamp(clock / 25)})` }} /></div>
      <div className="answer-form">
        <div className={`ad-input ${typing ? 'focused' : ''}`}>
          {text ? <span>{text}</span> : <span className="ad-placeholder">Call your play…</span>}
          {caret && <span className="ad-caret" />}
        </div>
        <span className="btn btn-snap ad-snap" style={pressed ? { transform: 'translateY(3px)', boxShadow: '0 2px 0 var(--amber-deep)' } : undefined}>SNAP</span>
      </div>
    </section>
  )
}

// ---------- Broadcast booth ----------
function talking(who: 'PBP' | 'COLOR', t: number): boolean {
  const line = LINES.find((l) => l.who === who && !l.voiceOnly && within(t, l.start, l.end))
  if (!line) return false
  const typingFor = line.text.length / (line.cps ?? 30) + 0.25
  return t - line.start < typingFor && Math.floor(t * 9) % 2 === 0
}

function Booth({ t }: { t: number }) {
  const main = within(t, T.boothIn, T.boothOut)
  const no = within(t, T.boothNo, T.boothNoOut)
  if (!main && !no) return null
  const enter = main ? prog(t, T.boothIn, T.boothIn + 0.2) : 1
  const pbpPose: BoothPose = talking('PBP', t) ? 'open' : 'closed'
  const colorPose: BoothPose = no ? 'hype' : talking('COLOR', t) ? 'open' : 'closed'
  const colorHop = no ? Math.abs(Math.sin((t - T.boothNo) * 14)) * 10 : 0
  const pbpLean = no ? -6 : 0
  const pop = main ? easeBack(prog(t, T.bradyPop, T.bradyPop + 0.3)) : 0
  const zoom = no ? 1.12 : 1
  return (
    <div className="ad-booth" style={{ opacity: enter }}>
      <div className="ad-booth-inner" style={{ transform: `scale(${zoom})`, transformOrigin: '66% 80%' }}>
        <div className="ad-booth-window">
          <div className="ad-booth-glow l" />
          <div className="ad-booth-glow r" />
          <div className="ad-booth-crowd" />
          <div className="ad-booth-field" />
          <div className="ad-booth-mullion" style={{ left: '33%' }} />
          <div className="ad-booth-mullion" style={{ left: '66%' }} />
        </div>
        <img src={announcerUrl(pbpPose, PBP)} className="ad-announcer" style={{ left: 64, transform: `translateX(${pbpLean}px)` }} alt="" />
        <img src={announcerUrl(colorPose, COLOR)} className="ad-announcer" style={{ left: 248, top: 128 - colorHop }} alt="" />
        <div className="ad-desk">
          <span className="ad-nameplate" style={{ left: 52 }}>PLAY-BY-PLAY</span>
          <span className="ad-desk-logo">4TH &amp; LONG</span>
          <span className="ad-nameplate" style={{ left: 254 }}>COLOR</span>
        </div>
      </div>
      {main && t >= T.bradyPop && (
        <div className="ad-tier-pop" style={{ opacity: clamp(pop), transform: `translateX(-50%) scale(${0.7 + 0.3 * pop})` }}>
          <span className="ad-tier-sq" style={{ background: TIERS[1].color, boxShadow: `0 0 12px ${TIERS[1].color}` }} />
          <div>
            <div className="ad-tier-name">TOM BRADY</div>
            <div className="ad-tier-val">= CHECKDOWN · +1 YD</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Hail Mary reveal ----------
function Reveal({ t }: { t: number }) {
  if (!within(t, T.reveal, T.throwSnap)) return null
  const color = TIERS[5].color
  const p = easeBack(prog(t, T.reveal, T.reveal + 0.35))
  const sub = prog(t, T.reveal + 0.3, T.reveal + 0.5)
  const pts = Math.round(lerp(0, 100, easeOut(prog(t, T.reveal + 0.2, T.reveal + 0.85))))
  const out = prog(t, T.throwSnap - 0.12, T.throwSnap)
  return (
    <section className="reveal ad-reveal" style={{ ['--tier' as string]: color, opacity: 1 - out } as CSSProperties}>
      <div className="ad-burst" style={{ opacity: 0.9, transform: `translate(-50%, -50%) scale(${0.6 + prog(t, T.reveal, T.reveal + 0.8) * 0.6}) rotate(${t * 20}deg)` }} />
      <h2 className="reveal-title ad-reveal-title" style={{ transform: `scale(${0.4 + 0.6 * p})`, opacity: clamp(p * 1.5) }}>Hail Mary</h2>
      <p className="reveal-answer" style={{ opacity: sub }}>“Jeff Hostetler”</p>
      <p className="reveal-gain" style={{ opacity: sub }}>
        <span className="pts">+{pts} PTS</span> · <span>+10 YDS</span>
      </p>
      <p className="reveal-blurb" style={{ opacity: sub }}>{TIERS[5].blurb}</p>
    </section>
  )
}

function Touchdown({ t }: { t: number }) {
  if (!within(t, T.catch, T.endCard)) return null
  const p = easeBack(prog(t, T.catch, T.catch + 0.32))
  const sub = prog(t, T.catch + 0.5, T.catch + 0.75)
  return (
    <div className="ad-td">
      <div className="ad-td-word" style={{ transform: `scale(${2.2 - 1.2 * p})`, opacity: clamp(prog(t, T.catch, T.catch + 0.1)) }}>TOUCHDOWN</div>
      <div className="led ad-td-sub" style={{ opacity: sub }}>7 PLAYS · 50 YARDS</div>
    </div>
  )
}

// ---------- Booth chyron (all lines are on-screen text) ----------
function Chyron({ t }: { t: number }) {
  const line = LINES.find((l) => !l.voiceOnly && within(t, l.start, l.end))
  if (!line) return null
  const first = prog(t, line.start, line.start + 0.12)
  const text = typed(line.text, t, line.start, line.cps ?? 30)
  const tagColor = line.who === 'PBP' ? '#ffb627' : '#e0434d'
  return (
    <div className="ad-chyron" style={{ opacity: first }}>
      <span className="ad-chyron-tag" style={{ background: tagColor, color: line.who === 'PBP' ? '#1c1304' : '#fff' }}>
        {SPEAKER[line.who]}
      </span>
      <div className={`ad-chyron-text ${line.big ? 'big' : ''}`}>
        {text}<span className="ad-chyron-ghost">{line.text.slice(text.length)}</span>
      </div>
    </div>
  )
}

// ---------- End card ----------
function EndCard({ t }: { t: number }) {
  if (t < T.endCard) return null
  const s = (a: number, d = 0.25) => prog(t, T.endCard + a, T.endCard + a + d)
  const title = easeBack(s(0.1, 0.35))
  const lines = ['7 plays.', 'Same for everyone.', 'New every day.']
  return (
    <div className="ad-end">
      <h1 className="game-title ad-end-title" style={{ transform: `scale(${1.6 - 0.6 * title})`, opacity: clamp(title * 2) }}>
        <span>4TH</span><span>&amp;</span><span>LONG</span>
      </h1>
      <p className="subtitle led ad-end-sub" style={{ opacity: s(0.45) }}>THE DAILY DRIVE</p>
      <div className="ad-end-squares">
        {([1, 2, 3, 4, 5] as const).map((id, i) => {
          const q = easeBack(s(0.7 + i * 0.09, 0.2))
          return <span key={id} style={{ background: TIERS[id].color, boxShadow: `0 0 14px ${TIERS[id].color}`, transform: `scale(${q})`, opacity: clamp(q) }} />
        })}
      </div>
      <div className="ad-end-lines">
        {lines.map((l, i) => (
          <p key={l} style={{ opacity: s(1.35 + i * 0.32), transform: `translateY(${(1 - easeOut(s(1.35 + i * 0.32))) * 10}px)` }}>{l}</p>
        ))}
      </div>
      <p className="ad-end-rule" style={{ opacity: s(2.45) }}>Rarer answer = more yards</p>
      <div className="btn btn-hero ad-end-cta" style={{ opacity: s(2.85), transform: `translateY(${(1 - easeOut(s(2.85))) * 12}px)` }}>
        PLAY FREE ▸ 4THANDLONG.IO
      </div>
    </div>
  )
}

// ---------- Confetti (deterministic) ----------
interface Burst { t0: number; n: number; x: number; y: number; spread: number; power: number; colors: string[]; footballs: boolean; dir?: number }
const BURSTS: Burst[] = [
  { t0: T.reveal, n: 70, x: 216, y: 330, spread: 140, power: 520, colors: ['#ffd23f', '#fff3b0', '#f2efe4'], footballs: false },
  { t0: T.catch, n: 150, x: 216, y: 300, spread: 160, power: 640, colors: ['#ffd23f', '#ffb627', '#f2efe4', '#4fa3ff', '#7ddc5f', '#b57bff'], footballs: true },
  { t0: T.catch + 0.25, n: 60, x: 0, y: 560, spread: 40, power: 700, colors: ['#ffd23f', '#f2efe4', '#ffb627'], footballs: true, dir: 40 },
  { t0: T.catch + 0.25, n: 60, x: W, y: 560, spread: 40, power: 700, colors: ['#ffd23f', '#f2efe4', '#ffb627'], footballs: true, dir: -40 },
]

function drawConfetti(ctx: CanvasRenderingContext2D, t: number) {
  ctx.clearRect(0, 0, W, H)
  BURSTS.forEach((b, bi) => {
    const dt = t - b.t0
    if (dt < 0 || dt > 3.4) return
    for (let i = 0; i < b.n; i++) {
      const r = (k: number) => rnd(i + bi * 1000, k)
      const ang = ((b.dir ?? 0) + (r(1) - 0.5) * b.spread - 90) * (Math.PI / 180)
      const v = b.power * (0.45 + r(2) * 0.65)
      const drag = 1.6
      const k = (1 - Math.exp(-drag * dt)) / drag
      const x = b.x + Math.cos(ang) * v * k + Math.sin(dt * 3 + r(3) * 6) * 12
      const y = b.y + Math.sin(ang) * v * k + 260 * dt * dt * 0.5 + 140 * dt
      const alpha = clamp(1 - (dt - 2.4) / 1)
      if (alpha <= 0) continue
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(x, y)
      ctx.rotate(dt * (4 + r(4) * 8) + r(5) * 6)
      if (b.footballs && i % 9 === 0) {
        ctx.fillStyle = '#9a5528'
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#f2efe4'; ctx.fillRect(-4, -0.6, 8, 1.2)
      } else {
        ctx.fillStyle = b.colors[i % b.colors.length]
        const flip = Math.abs(Math.cos(dt * (6 + r(6) * 6)))
        ctx.fillRect(-4, -2.5 * flip, 8, 5 * flip)
      }
      ctx.restore()
    }
  })
}

function Confetti({ t }: { t: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr }
    const ctx = c.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawConfetti(ctx, t)
  }, [t])
  return <canvas ref={ref} className="ad-confetti" style={{ width: W, height: H }} />
}

// ---------- The frame ----------
export function FinalPlay({ t }: { t: number }) {
  // Camera shake on the touchdown
  const sp = prog(t, T.catch, T.catch + 0.55)
  const shake = sp > 0 && sp < 1 ? (1 - sp) * 9 : 0
  const sx = Math.sin(t * 97) * shake, sy = Math.cos(t * 83) * shake * 0.7
  const freeze = within(t, T.freeze, T.reveal) ? prog(t, T.freeze, T.freeze + 0.15) : 0
  const flashY = within(t, T.reveal, T.reveal + 0.35) ? 0.55 * (1 - prog(t, T.reveal, T.reveal + 0.35)) : 0
  const flashW = within(t, T.catch, T.catch + 0.3) ? 0.6 * (1 - prog(t, T.catch, T.catch + 0.3))
    : within(t, T.endCard, T.endCard + 0.3) ? 0.5 * (1 - prog(t, T.endCard, T.endCard + 0.3)) : 0
  const clock = clockAt(t)
  const urgent = within(t, 9.8, T.freeze) && clock <= 5
  const beat = (t % 1)
  const vignette = urgent ? (beat < 0.15 ? 0.35 + beat / 0.15 * 0.65 : beat < 0.3 ? 1 - (beat - 0.15) / 0.15 * 0.5 : beat < 0.45 ? 0.5 + (beat - 0.3) / 0.15 * 0.4 : 0.9 - (beat - 0.45) / 0.55 * 0.55) : 0
  const fade = prog(t, T.fadeOut, DURATION)
  return (
    <div className="ad-frame">
      <div className="ad-world" style={{ transform: `translate(${sx}px, ${sy}px)`, filter: freeze ? `saturate(${1 - freeze * 0.85}) brightness(${1 - freeze * 0.3})` : undefined }}>
        <Stadium t={t} />
        {t < T.endCard && <Board t={t} />}
        <Hook t={t} />
        <PixelField t={t} />
        <Presnap t={t} />
        <PlayCard t={t} />
        <Booth t={t} />
        <Reveal t={t} />
        <Touchdown t={t} />
        <EndCard t={t} />
        <div className="ad-vignette" style={{ opacity: vignette }} />
      </div>
      <Confetti t={t} />
      <Chyron t={t} />
      <div className="ad-flash" style={{ background: '#ffd23f', opacity: flashY }} />
      <div className="ad-flash" style={{ background: '#fff', opacity: flashW }} />
      <div className="ad-flash" style={{ background: '#000', opacity: t < T.lightsOn ? 1 : fade }} />
    </div>
  )
}
