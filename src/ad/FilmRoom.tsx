// "Film Room #001: Alabama QBs": a 9:16 ad for TikTok and Reels, about 29 seconds.
// A mystery player in the tunnel, then 12 silhouettes on the field. Three clues
// (played QB in the NFL, played in the SEC, played at Alabama) get the wrong ones
// flagged off until five are left on 4th & Long. Every one of the five is a right
// answer: the booth calls Tua, Hurts and Bryce Young Checkdowns, and the last two
// stay dark so viewers name the rarest one in the comments.
//
// Same rules as the other ads: everything on screen is computed from t (seconds),
// with no CSS animations or timers, so the recorder can step frames.

import type { CSSProperties, ReactNode } from 'react'
import { GOLD, spriteUrl, type Pose } from '../components/sprites'
import { TIERS } from '../engine/tiers'
import { CLUES, DURATION, FINAL, FLAG_FALL, FLAG_GAP, LINES, SUSPECTS, T, type Suspect } from './timeline-film-room'

const SPEAKER = { PBP: 'PLAY-BY-PLAY', COLOR: 'COLOR' }

// ---------- Helpers ----------
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const easeBack = (p: number) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2) }
const within = (t: number, a: number, b: number) => t >= a && t < b
const rnd = (i: number, n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1

function typed(text: string, t: number, start: number, cps = 30): string {
  return text.slice(0, Math.max(0, Math.floor((t - start) * cps)))
}

/** A black silhouette with a 1-2px rim in `color`, plus an optional glow. */
function silhouette(color: string, glow = 0, rim = 1.5): string {
  const r = `${rim}px`
  const parts = [`brightness(0)`, `drop-shadow(${r} 0 0 ${color})`, `drop-shadow(-${r} 0 0 ${color})`, `drop-shadow(0 ${r} 0 ${color})`, `drop-shadow(0 -${r} 0 ${color})`]
  if (glow > 0) parts.push(`drop-shadow(0 0 ${glow}px ${color})`)
  return parts.join(' ')
}
const DIM_RIM = 'rgba(160, 200, 175, 0.55)'

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

/** The crowd pops on the Alabama clue. */
const roaring = (t: number) => within(t, T.cheer, T.cheer + 2.2)

function Stadium({ t }: { t: number }) {
  const lv = lightsLevel(t)
  const roar = roaring(t)
  const dark = t >= T.endCard ? 0.4 : t < T.fieldIn ? 0.78 : roar ? 0.5 : 0.7
  return (
    <div className="stadium ad-stadium">
      <div className="sky" />
      <div className="ad-beam left" style={{ opacity: lv * 0.9, transform: `rotate(${Math.sin(t * 0.6) * 2.5}deg)` }} />
      <div className="ad-beam right" style={{ opacity: lv * 0.9, transform: `rotate(${-Math.sin(t * 0.5 + 1) * 2.5}deg)` }} />
      <div className="lights left" style={{ opacity: lv, filter: 'blur(2px)' }} />
      <div className="lights right" style={{ opacity: lv, filter: 'blur(2px)' }} />
      <div className="crowd" style={{ opacity: lv * 0.8, transform: roar ? `translateY(${-Math.abs(Math.sin(t * 11)) * 3}px)` : undefined }}>
        {BULBS.map((b, i) => {
          const cyc = (t / (roar ? b.dur / 5 : b.dur) + b.phase) % 1
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

// ---------- Opening hook: the mystery player in the tunnel ----------
function Hook({ t }: { t: number }) {
  if (t < T.hookIn || t > T.hookOut + 0.3) return null
  const flick = t < T.hookIn + 0.08 ? 0.4 : t < T.hookIn + 0.14 ? 0.1 : 1
  const out = prog(t, T.hookOut, T.hookOut + 0.28)
  const title = easeBack(prog(t, T.hookTitle, T.hookTitle + 0.3))
  const push = 1 + 0.06 * prog(t, T.hookIn, T.hookOut + 0.3)
  const s = spriteUrl('stand', GOLD, 0)
  const scale = 9
  const q = 0.75 + 0.25 * Math.sin(t * 6)
  return (
    <div className="fr-hook" style={{ opacity: flick * (1 - out) }}>
      <div className="ad-hook-board fr-hook-board">
        <span className="led fr-hook-led">FILM ROOM #001</span>
      </div>
      <div className="fr-tunnel" style={{ transform: `scale(${push})` }}>
        <div className="fr-tunnel-light" />
        <img
          src={s.url}
          className="fr-mystery"
          style={{ width: s.w * scale, height: s.h * scale, filter: silhouette('rgba(255, 236, 190, 0.9)', 14, 2.5) }}
          alt=""
        />
        <span className="fr-mystery-q" style={{ opacity: q }}>?</span>
        <div className="fr-tunnel-fog" />
      </div>
      <p className="fr-hook-title" style={{ opacity: clamp(title * 2), transform: `scale(${1.5 - 0.5 * title}) rotate(-2deg)` }}>
        Who's under<br />the helmet?
      </p>
    </div>
  )
}

// ---------- Scoreboard: series, down and distance, players left ----------
function landedFlags(t: number): number {
  let n = 0
  for (const c of CLUES) {
    const out = SUSPECTS.filter((s) => s.out === c.n).length
    for (let i = 0; i < out; i++) if (t >= c.flags + i * FLAG_GAP + FLAG_FALL) n++
  }
  return n
}

/** When each down shows on the scoreboard: clue 3's down flips at the freeze, before its card. */
const downAtOf = (c: (typeof CLUES)[number]) => (c.n === 3 ? T.freeze : c.at)

function downText(t: number): string {
  if (t >= T.fourth) return '4TH & LONG'
  const c = [...CLUES].reverse().find((x) => t >= downAtOf(x) - 0.1)
  return c ? c.down : '1ST & 10'
}

function Board({ t }: { t: number }) {
  const p = prog(t, T.boardIn, T.boardIn + 0.35)
  const left = 12 - landedFlags(t)
  const lastDrop = Math.max(...CLUES.flatMap((c) => SUSPECTS.filter((s) => s.out === c.n).map((_, i) => c.flags + i * FLAG_GAP + FLAG_FALL)).filter((x) => x <= t), -9)
  const bump = 1 + 0.35 * (1 - prog(t, lastDrop, lastDrop + 0.25))
  const cur = [...CLUES].reverse().find((x) => t >= downAtOf(x) - 0.1)
  const downAt = t >= T.fourth ? T.fourth : (cur ? downAtOf(cur) : 0) - 0.1
  const flip = easeBack(prog(t, downAt, downAt + 0.3))
  const fourth = t >= T.fourth
  return (
    <div className="ad-board" style={{ opacity: p, transform: `translateY(${(1 - easeOut(p)) * -16}px)` }}>
      <header className="scoreboard fr-scoreboard">
        <div className="sb-box">
          <span className="sb-label">FILM ROOM</span>
          <span className="led led-sm">#001</span>
        </div>
        <div className="sb-center">
          <span className="sb-label">DOWN</span>
          <span className={`led fr-down ${fourth ? 'fourth' : ''}`} style={{ transform: `scale(${0.75 + 0.25 * flip})` }}>{downText(t)}</span>
        </div>
        <div className="sb-box right">
          <span className="sb-label">LEFT</span>
          <span className="led led-sm" style={{ display: 'inline-block', transform: `scale(${bump})` }}>{left}</span>
        </div>
      </header>
    </div>
  )
}

// ---------- Clue card ----------
function ClueCard({ t }: { t: number }) {
  if (t < T.clue1 || t >= T.fourth + 0.15) return null
  const freezing = within(t, T.freeze, T.clue3)
  const c = freezing ? CLUES[2] : ([...CLUES].reverse().find((x) => t >= x.at) ?? CLUES[0])
  const cardAt = freezing ? T.freeze : c.at
  const slam = easeBack(prog(t, cardAt, cardAt + 0.3))
  const shown = !freezing && t >= c.reveal
  const pop = easeBack(prog(t, c.reveal, c.reveal + 0.25))
  const out = prog(t, T.fourth, T.fourth + 0.15)
  return (
    <div className="fr-clue" style={{ opacity: clamp(slam * 2) * (1 - out), transform: `scale(${1.25 - 0.25 * slam})` }}>
      <span className="fr-clue-tag">CLUE {c.n}</span>
      {shown
        ? <span className="fr-clue-text" style={{ display: 'inline-block', transform: `scale(${0.8 + 0.2 * pop})`, transformOrigin: 'left center', opacity: clamp(pop * 2) }}>{c.text}</span>
        : <span className="fr-clue-text">. . .</span>}
    </div>
  )
}

// ---------- The field and the silhouettes ----------
const FH = 296
const FW = 432
const PX_YD = 13.5
const ROW_Y = [112, 236] // feet, in field coordinates
const ROW_SCALE = [2.9, 3.4]
const colX = (row: number, col: number) => (row === 0 ? 50 : 81) + col * 62
const FINAL_Y = 250
const FINAL_SCALE = 3.7
const slotX = (slot: number) => 60 + slot * 78

/** Order of a suspect within his elimination round (for staggered flags). */
function roundIndex(s: Suspect): number {
  return SUSPECTS.filter((x) => x.out === s.out).indexOf(s)
}

interface Placed { key: string; x: number; y: number; scale: number; pose: Pose; filter: string; opacity: number; flip?: boolean; label?: ReactNode }

function rolePose(role: Suspect['role']): Pose {
  return role === 'qb' ? 'hold' : role === 'ol' ? 'block' : role === 'wr' ? 'ready' : 'stand'
}

const runPose = (dist: number): Pose => `run${Math.floor(dist / 9) % 4}` as Pose

function place(s: Suspect, i: number, t: number): Placed | null {
  const homeX = colX(s.row, s.col)
  const homeY = ROW_Y[s.row]
  const homeScale = ROW_SCALE[s.row]
  const key = `p${i}`
  if (s.out > 0) {
    const c = CLUES[s.out - 1]
    const k = roundIndex(s)
    const flagged = t >= c.flags + k * FLAG_GAP + FLAG_FALL
    const go = c.off + k * 0.14
    if (t >= go) {
      // Jog off to the sideline (right), out of frame.
      const p = prog(t, go, go + 1.15)
      const x = homeX + (FW + 60 - homeX) * easeInOut(p)
      if (p >= 1) return null
      return { key, x, y: homeY, scale: homeScale, pose: runPose(x - homeX), filter: silhouette('rgba(255, 90, 80, 0.7)'), opacity: 1 - prog(p, 0.75, 1) }
    }
    return { key, x: homeX, y: homeY, scale: homeScale, pose: rolePose(s.role), filter: silhouette(flagged ? 'rgba(255, 90, 80, 0.9)' : DIM_RIM, flagged ? 6 : 0), opacity: 1 }
  }
  // One of the five: regroup into a row on 4th & Long, then light up one by one.
  const slot = s.slot ?? 0
  const p = easeInOut(prog(t, T.regroup, T.regroup + 0.75))
  const x = homeX + (slotX(slot) - homeX) * p
  const y = homeY + (FINAL_Y - homeY) * p
  const scale = homeScale + (FINAL_SCALE - homeScale) * p
  const moving = p > 0 && p < 1
  const f = FINAL[slot]
  const lit = t >= f.at
  const color = TIERS[f.tier].color
  let filter = silhouette(DIM_RIM)
  if (lit) {
    const pop = 1 - prog(t, f.at, f.at + 0.5)
    const pulse = f.tier === 5 ? 0.5 + 0.5 * Math.sin((t - f.at) * 6) : 0
    filter = silhouette(color, 6 + pop * 18 + pulse * 14, 2)
  }
  let label: ReactNode
  if (t >= T.fourth && !moving && p >= 1) {
    const lp = lit ? easeBack(prog(t, f.at, f.at + 0.3)) : 1
    label = f.name === '?'
      ? <span className="fr-tag fr-tag-q" style={{ color: lit ? color : '#9fb3a6', borderColor: lit ? color : '#2a4434', transform: `translateX(-50%) scale(${lit ? 1 + 0.15 * Math.sin((t - f.at) * 6) * (f.tier === 5 ? 1 : 0) : 1})` }}>?</span>
      : lit
        ? <span className="fr-tag" style={{ borderColor: color, boxShadow: `0 0 12px ${color}`, transform: `translateX(-50%) scale(${lp})`, opacity: clamp(lp * 2) }}>{f.name}</span>
        : <span className="fr-tag fr-tag-q">?</span>
  }
  return { key, x, y, scale, pose: moving ? runPose(Math.abs(x - homeX) + Math.abs(y - homeY)) : 'hold', filter, opacity: 1, flip: moving && slotX(slot) < homeX, label }
}

/** Yellow penalty flags: thrown in, tumble to the turf by the player, stay a moment. */
function Flags({ t }: { t: number }) {
  const out: ReactNode[] = []
  SUSPECTS.forEach((s, i) => {
    if (s.out === 0) return
    const c = CLUES[s.out - 1]
    const k = roundIndex(s)
    const t0 = c.flags + k * FLAG_GAP
    if (t < t0) return
    const fade = prog(t, c.off + 1.6, c.off + 2.0)
    if (fade >= 1) return
    const p = prog(t, t0, t0 + FLAG_FALL)
    const x = colX(s.row, s.col) + 16
    const y0 = -30
    const y1 = ROW_Y[s.row] - 4
    const y = y0 + (y1 - y0) * (p * p)
    const spin = (1 - p) * 540 + 20
    out.push(
      <svg key={`f${i}`} className="fr-flag" viewBox="0 0 12 12" width={15} height={15}
        style={{ left: x + (1 - p) * -24, top: y - 7, transform: `rotate(${spin}deg)`, opacity: 1 - fade }}>
        <rect x="0" y="0" width="12" height="12" fill="#ffd23f" />
        <rect x="0" y="0" width="12" height="2" fill="#e0b21a" />
        <rect x="5" y="4" width="3" height="3" fill="#2a2a2a" />
      </svg>,
    )
  })
  return <>{out}</>
}

function Field({ t }: { t: number }) {
  if (t < T.fieldIn || t >= T.endCard + 0.1) return null
  const fadeIn = prog(t, T.fieldIn, T.fieldIn + 0.3)
  const fadeOut = prog(t, T.endCard - 0.2, T.endCard + 0.1)
  const stripes: ReactNode[] = []
  for (let i = 0; i < 8; i++) stripes.push(<rect key={`s${i}`} x={i * 5 * PX_YD - 20} y={0} width={5 * PX_YD} height={FH} fill={i % 2 === 0 ? '#1d6b3a' : '#195f33'} />)
  const lines = Array.from({ length: 8 }, (_, i) => <rect key={`l${i}`} x={i * 5 * PX_YD - 21} y={0} width={2} height={FH} fill="rgba(242,239,228,0.6)" />)
  const placed = SUSPECTS.map((s, i) => place(s, i, t)).filter((p): p is Placed => !!p).sort((a, b) => a.y - b.y)
  // On 4th & Long the camera pushes in a little on the five.
  const zoom = 1 + 0.06 * easeOut(prog(t, T.regroup, T.regroup + 1.2))
  const spot = t >= T.fourth ? prog(t, T.fourth, T.fourth + 0.6) : 0
  return (
    <div className="ad-field fr-field" style={{ opacity: fadeIn * (1 - fadeOut) }}>
      <div className="ad-cam" style={{ transform: `scale(${zoom})`, transformOrigin: `50% ${FINAL_Y}px` }}>
        <svg className="ad-field-svg" viewBox={`0 0 ${FW} ${FH}`} width={FW} height={FH}>
          {stripes}
          {lines}
          <text x={FW / 2} y={FH - 20} className="ad-yd-num" textAnchor="middle" opacity={0.5}>4TH &amp; LONG</text>
        </svg>
        <div className="fr-spot" style={{ opacity: spot * 0.9 }} />
        <div className="ad-players">
          {placed.map((b) => {
            const sp = spriteUrl(b.pose, GOLD, 0)
            const w = sp.w * b.scale, h = sp.h * b.scale
            return (
              <div key={b.key} className="fr-body" style={{ left: b.x - w / 2, top: b.y - h, width: w, height: h, opacity: b.opacity }}>
                <img src={sp.url} className="ad-pl" style={{ left: 0, top: 0, width: w, height: h, filter: b.filter, transform: b.flip ? 'scaleX(-1)' : undefined }} alt="" />
                {b.label}
              </div>
            )
          })}
          <Flags t={t} />
        </div>
      </div>
      <div className="ad-field-fade" />
    </div>
  )
}

// ---------- 4th & Long slam, then the tier pops ----------
function FourthSlam({ t }: { t: number }) {
  if (!within(t, T.fourth, T.lit1)) return null
  const p = easeBack(prog(t, T.fourth, T.fourth + 0.3))
  const out = prog(t, T.lit1 - 0.15, T.lit1)
  return (
    <div className="fr-fourth" style={{ opacity: clamp(p * 2) * (1 - out), transform: `scale(${1.6 - 0.6 * p})` }}>
      <span className="led fr-fourth-led">4TH &amp; LONG</span>
      <span className="fr-fourth-sub">5 left. All of them fit.</span>
    </div>
  )
}

function TierPop({ t }: { t: number }) {
  if (!within(t, T.lit1, T.cta)) return null
  const f = [...FINAL].reverse().find((x) => t >= x.at && x.name !== '?') ?? FINAL[0]
  const hail = t >= T.darkTwo
  const tier = TIERS[hail ? 5 : f.tier]
  const at = hail ? T.darkTwo : f.at
  const p = easeBack(prog(t, at, at + 0.3))
  const out = prog(t, T.cta - 0.15, T.cta)
  const yards = hail ? 10 : 1
  return (
    <div className="fr-pop" style={{ borderColor: tier.color, boxShadow: `0 0 30px ${tier.color}55, 0 12px 30px rgba(0,0,0,0.6)`, opacity: clamp(p * 2) * (1 - out), transform: `translateX(-50%) scale(${0.7 + 0.3 * p})` }}>
      <span className="ad-tier-sq" style={{ background: tier.color, boxShadow: `0 0 12px ${tier.color}` }} />
      <div>
        <div className="fr-pop-name">{hail ? 'NOBODY SAID IT' : f.full}</div>
        <div className="fr-pop-tier" style={{ color: tier.color }}>{tier.name.toUpperCase()} · +{yards} {yards === 1 ? 'YD' : 'YDS'}</div>
      </div>
    </div>
  )
}

function Cta({ t }: { t: number }) {
  if (!within(t, T.cta, T.endCard)) return null
  const p = easeBack(prog(t, T.cta, T.cta + 0.35))
  const sub = prog(t, T.cta + 0.5, T.cta + 0.8)
  const out = prog(t, T.endCard - 0.2, T.endCard)
  const arrow = Math.abs(Math.sin((t - T.cta) * 5)) * 5
  return (
    <div className="fr-cta" style={{ opacity: clamp(p * 2) * (1 - out) }}>
      <p className="fr-cta-big" style={{ transform: `scale(${1.4 - 0.4 * p}) rotate(-2deg)` }}>Name the<br />rarest one</p>
      <p className="fr-cta-sub" style={{ opacity: sub }}>
        In the comments <span style={{ display: 'inline-block', transform: `translateY(${arrow}px)` }}>▼</span>
      </p>
      <p className="fr-cta-pin" style={{ opacity: sub }}>Deepest answer gets pinned</p>
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
    <div className="ad-chyron fr-chyron" style={{ opacity: first }}>
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
  return (
    <div className="ad-end">
      <h1 className="game-title ad-end-title" style={{ transform: `scale(${1.6 - 0.6 * title})`, opacity: clamp(title * 2) }}>
        <span>4TH</span><span>&amp;</span><span>LONG</span>
      </h1>
      <p className="subtitle led ad-end-sub" style={{ opacity: s(0.45) }}>THE DAILY DRIVE</p>
      <div className="ad-end-squares">
        {([1, 2, 3, 4, 5] as const).map((id, i) => {
          const sq = easeBack(s(0.7 + i * 0.09, 0.2))
          return <span key={id} style={{ background: TIERS[id].color, boxShadow: `0 0 14px ${TIERS[id].color}`, transform: `scale(${sq})`, opacity: clamp(sq) }} />
        })}
      </div>
      <div className="ad-end-lines" style={{ opacity: s(1.3) }}>
        <p>7 new prompts</p>
        <p>every day</p>
      </div>
      <p className="ad-end-rule" style={{ opacity: s(2.0) }}>Rarer answers gain more yards</p>
      <div className="btn btn-hero ad-end-cta" style={{ opacity: s(2.6), transform: `translateY(${(1 - easeOut(s(2.6))) * 12}px)` }}>
        PLAY FREE ▸ 4THANDLONG.IO
      </div>
    </div>
  )
}

// ---------- The frame ----------
export function FilmRoom({ t }: { t: number }) {
  const freeze = within(t, T.freeze, T.clue3) ? prog(t, T.freeze, T.freeze + 0.15) : 0
  const flashW = (at: number, k = 0.35) => (within(t, at, at + 0.3) ? k * (1 - prog(t, at, at + 0.3)) : 0)
  const white = Math.max(flashW(T.endCard, 0.5), flashW(T.fourth, 0.3), ...FINAL.slice(0, 3).map((f) => flashW(f.at, 0.12)))
  // A jolt when 4th & Long slams in.
  const sp = prog(t, T.fourth, T.fourth + 0.4)
  const shake = sp > 0 && sp < 1 ? (1 - sp) * 6 : 0
  const sx = Math.sin(t * 97) * shake, sy = Math.cos(t * 83) * shake * 0.7
  const beat = (t - T.freeze) % 0.75
  const vignette = freeze ? 0.45 + 0.4 * (1 - beat / 0.75) : 0
  const fade = prog(t, T.fadeOut, DURATION)
  const style: CSSProperties = { transform: `translate(${sx}px, ${sy}px)`, filter: freeze ? `saturate(${1 - freeze * 0.85}) brightness(${1 - freeze * 0.3})` : undefined }
  return (
    <div className="ad-frame">
      <div className="ad-world" style={style}>
        <Stadium t={t} />
        {t < T.endCard && <Board t={t} />}
        <Hook t={t} />
        <Field t={t} />
        <ClueCard t={t} />
        <FourthSlam t={t} />
        <TierPop t={t} />
        <Cta t={t} />
        <EndCard t={t} />
        <div className="ad-vignette" style={{ opacity: vignette }} />
      </div>
      <Chyron t={t} />
      <div className="ad-flash" style={{ background: '#fff', opacity: white }} />
      <div className="ad-flash" style={{ background: '#000', opacity: t < T.lightsOn ? 1 : fade }} />
    </div>
  )
}
