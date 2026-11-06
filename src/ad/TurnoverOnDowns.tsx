// "Turnover on Downs": a 9:16 ad for TikTok and Reels, about 27 seconds.
// Play 1 of 7, ball at midfield, "Name a quarterback who started and won a
// Super Bowl." The player confidently types three of today's star QBs who have
// never started one (Josh Allen, Lamar Jackson, Dak Prescott) and burns all
// three downs. The booth falls apart; the end card asks who he should have said.
//
// Same rules as FinalPlay.tsx: everything on screen is computed from t
// (seconds), with no CSS animations or timers, so the recorder can step frames.

import type { CSSProperties, ReactNode } from 'react'
import { CRIMSON, GOLD, spriteUrl, type Pose, type TeamColors } from '../components/sprites'
import { MISS, TIERS } from '../engine/tiers'
import { announcerUrl, COLOR, PBP, type BoothPose } from './booth'
import { clockAt, DURATION, GUESSES, LINES, T } from './timeline-turnover'

const SPEAKER = { PBP: 'PLAY-BY-PLAY', COLOR: 'COLOR' }
const MISS_GRAY = '#3a3f3c' // a missed play's bulb on the scoreboard (Scoreboard.tsx)
const DOWN_LABELS = ['1ST', '2ND', '3RD']

// ---------- Helpers ----------
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)
const easeBack = (p: number) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2) }
const within = (t: number, a: number, b: number) => t >= a && t < b
const rnd = (i: number, n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1

function typed(text: string, t: number, start: number, cps = 30): string {
  return text.slice(0, Math.max(0, Math.floor((t - start) * cps)))
}

/** Wrong guesses already snapped (0 to 3). */
const guessesIn = (t: number) => GUESSES.filter((g) => t >= g.snap).length

/** What's in the answer box: each guess is typed, snapped, then the box clears (as in Drive.tsx). */
function inputText(t: number): string {
  for (let i = GUESSES.length - 1; i >= 0; i--) {
    const g = GUESSES[i]
    if (t >= g.type) {
      if (t >= g.snap && i < GUESSES.length - 1) return ''
      return g.text.slice(0, Math.min(g.text.length, Math.floor((t - g.type) * g.cps) + 1))
    }
  }
  return ''
}

/** The miss notice the game shows under the answer box. */
function noticeText(t: number): string | null {
  const n = guessesIn(t)
  if (n === 0 || n >= 3) return null
  return `"${GUESSES[n - 1].text}" isn't on the board. ${DOWN_LABELS[n]} down.`
}

/** Crowd mood: 0 calm, -1 booing (dim stands, no camera flashes). */
const booing = (t: number) => within(t, T.snap3, T.boothC + 1.2)

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
  const boo = booing(t)
  const dark = t >= T.endCard ? 0.4 : boo ? 0.8 : t < T.fieldIn ? 0.55 : 0.72
  return (
    <div className="stadium ad-stadium">
      <div className="sky" />
      <div className="ad-beam left" style={{ opacity: lv * (boo ? 0.5 : 0.9), transform: `rotate(${Math.sin(t * 0.6) * 2.5}deg)` }} />
      <div className="ad-beam right" style={{ opacity: lv * (boo ? 0.5 : 0.9), transform: `rotate(${-Math.sin(t * 0.5 + 1) * 2.5}deg)` }} />
      <div className="lights left" style={{ opacity: lv, filter: 'blur(2px)' }} />
      <div className="lights right" style={{ opacity: lv, filter: 'blur(2px)' }} />
      <div className="crowd" style={{ opacity: lv * (boo ? 0.55 : 0.8), filter: boo ? 'brightness(0.6) saturate(0.6)' : undefined }}>
        {BULBS.map((b, i) => {
          const cyc = (t / b.dur + b.phase) % 1
          const o = lv < 1 || boo ? 0 : cyc > 0.96 && cyc < 0.985 ? 1 - (cyc - 0.96) / 0.025 : 0
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
function Board({ t }: { t: number }) {
  const p = prog(t, T.boardIn, T.boardIn + 0.35)
  const missed = t >= T.snap3
  const pulse = 0.5 + 0.5 * Math.sin(t * 5.2)
  const pct = (y: number) => ((52 - y) / 62) * 100
  return (
    <div className="ad-board" style={{ opacity: p, transform: `translateY(${(1 - easeOut(p)) * -16}px)` }}>
      <header className="scoreboard">
        <div className="sb-box">
          <span className="sb-label">BALL ON</span>
          <span className="led led-sm">50</span>
        </div>
        <div className="sb-center">
          <div className="bulbs">
            {Array.from({ length: 7 }, (_, i) => {
              const first = i === 0
              const style: CSSProperties | undefined = first
                ? missed
                  ? { background: MISS_GRAY, boxShadow: 'none', transform: `scale(${1 + 0.5 * (1 - prog(t, T.snap3, T.snap3 + 0.3))})` }
                  : { background: '#3b2a06', boxShadow: `0 0 0 2px var(--amber), 0 0 ${2 + pulse * 8}px rgba(255, 182, 39, 0.6)` }
                : undefined
              return <span key={i} className={`bulb ${first && missed ? 'done' : ''}`} style={style} />
            })}
          </div>
          <span className="sb-label">PLAY 1 OF 7</span>
        </div>
        <div className="sb-box right">
          <span className="sb-label">SCORE</span>
          <span className="led">0</span>
        </div>
      </header>
      <div className="field-strip compact">
        <div className="turf ad-turf">
          {[50, 40, 30, 20, 10].map((m) => (
            <div key={m} className="yard-line" style={{ left: `${pct(m)}%` }}><span>{m}</span></div>
          ))}
          <div className="fg-line" style={{ left: `${pct(35)}%` }}><span>FG RANGE</span></div>
          <div className="endzone" style={{ left: `${pct(0)}%` }}><span>END ZONE</span></div>
          <div className="ball-marker" style={{ left: `${pct(50)}%`, transform: 'translate(-50%, -50%)' }}>
            <svg viewBox="0 0 28 16" aria-hidden="true">
              <ellipse cx="14" cy="8" rx="13" ry="7.2" fill="#8a4a24" stroke="#3b1d0c" strokeWidth="1.2" />
              <path d="M7 8 H21" stroke="#fff" strokeWidth="1.3" />
              <path d="M10 6 V10 M12.6 6 V10 M15.3 6 V10 M18 6 V10" stroke="#fff" strokeWidth="1.1" />
            </svg>
          </div>
          <div className="scrimmage" style={{ left: `${pct(50)}%` }} />
        </div>
      </div>
    </div>
  )
}

// ---------- Opening hook: the question, straight away ----------
function Hook({ t }: { t: number }) {
  if (t < T.hookIn || t > T.hookOut + 0.3) return null
  const flick = t < T.hookIn + 0.08 ? 0.4 : t < T.hookIn + 0.14 ? 0.1 : 1
  const out = prog(t, T.hookOut, T.hookOut + 0.25)
  const line = prog(t, T.hookLine, T.hookLine + 0.25)
  const easy = easeBack(prog(t, T.hookEasy, T.hookEasy + 0.3))
  return (
    <div className="ad-hook" style={{ opacity: flick * (1 - out), transform: `scale(${1 - out * 0.08})` }}>
      <div className="ad-hook-board">
        <span className="sb-label ad-hook-small">PLAY 1 OF 7</span>
        <span className="led ad-hook-big">4TH &amp; LONG</span>
        <span className="led ad-hook-mid">BALL ON THE 50</span>
      </div>
      <p className="ad-hook-line" style={{ opacity: line, transform: `translateY(${(1 - easeOut(line)) * 12}px)` }}>
        Name a QB who<br />won a Super Bowl.
      </p>
      <p className="tod-hook-easy" style={{ opacity: clamp(easy), transform: `scale(${0.6 + 0.4 * easy}) rotate(-3deg)` }}>Easy, right?</p>
    </div>
  )
}

// ---------- Pixel field at midfield ----------
const FIELD_TOP = 200
const FIELD_BOT = 482
const FW = 432
const PX_YD = 13.5
const LOS = 50
const fx = (ytg: number) => (LOS + 12 - ytg) * PX_YD
const fy = (lat: number) => 250 + lat * 210
const SCALE = 3

interface Body { key: string; ytg: number; lat: number; pose: Pose; team: TeamColors; flip: boolean; skin: number; hop?: number }

function bodies(t: number): Body[] {
  const party = t >= T.celebrate
  const out: Body[] = []
  const hop = (k: number) => (party ? Math.abs(Math.sin((t - T.celebrate) * 9 + k)) * 10 : 0)
  const O = (key: string, ytg: number, lat: number, pose: Pose, skin: number) => out.push({ key, ytg, lat, pose, team: GOLD, flip: false, skin })
  const D = (key: string, ytg: number, lat: number, pose: Pose, skin: number, h = 0) => out.push({ key, ytg, lat, pose, team: CRIMSON, flip: true, skin, hop: h })

  // Offense: lined up before the snap; after the turnover they just stand there.
  const ol: [number, number][] = [[LOS + 0.7, 0.3], [LOS + 0.7, 0.4], [LOS + 0.7, 0.5], [LOS + 0.7, 0.6], [LOS + 0.7, 0.7], [LOS + 0.8, 0.8]]
  ol.forEach(([y, l], i) => O(`ol${i}`, y, l, party ? 'stand' : 'stance', i + 1))
  O('qb', LOS + 5, 0.5, party ? 'stand' : 'ready', 0)
  O('rb', LOS + 5, 0.62, party ? 'stand' : 'ready', 3)
  O('wr1', LOS + 0.7, 0.06, party ? 'stand' : 'ready', 4)
  O('wr2', LOS + 0.7, 0.96, party ? 'stand' : 'ready', 2)

  // Defense: in their stance, then celebrating the stop.
  const dl: [number, number][] = [[LOS - 0.7, 0.36], [LOS - 0.7, 0.5], [LOS - 0.7, 0.64]]
  // On the stop they spill toward their own sideline (right) to celebrate, away from the offense.
  const run = easeOut(prog(t, T.celebrate, T.celebrate + 0.5))
  const at = (pre: number, post: number) => pre + (post - pre) * run
  dl.forEach(([y, l], i) => D(`dl${i}`, party ? at(y, LOS - 4.5 - i * 0.6) : y, party ? at(l, 0.3 + i * 0.22) : l, party ? 'cheer' : 'stance', i + 2, hop(i)))
  D('lb0', party ? at(LOS - 4, LOS - 8) : LOS - 4, party ? at(0.3, 0.5) : 0.3, party ? 'cheerball' : 'ready', 1, party ? Math.abs(Math.sin((t - T.celebrate) * 8)) * 16 : 0)
  D('lb1', party ? at(LOS - 4, LOS - 10) : LOS - 4, party ? at(0.7, 0.78) : 0.7, party ? 'cheer' : 'ready', 4, hop(5))
  D('cb0', party ? at(LOS - 0.8, LOS - 6) : LOS - 0.8, party ? at(0.06, 0.12) : 0.06, party ? 'cheer' : 'ready', 0, hop(2))
  D('cb1', party ? at(LOS - 0.8, LOS - 6.5) : LOS - 0.8, party ? at(0.96, 0.92) : 0.96, party ? 'cheer' : 'ready', 3, hop(7))
  D('s0', party ? at(LOS - 11, LOS - 11.5) : LOS - 11, party ? at(0.4, 0.28) : 0.4, party ? 'cheer' : 'ready', 2, hop(3))
  D('s1', party ? at(LOS - 11, LOS - 12) : LOS - 11, party ? at(0.62, 0.66) : 0.62, party ? 'cheer' : 'ready', 1, hop(6))
  return out
}

function PixelField({ t }: { t: number }) {
  const showPre = within(t, T.fieldIn, T.cardIn + 0.25)
  const showParty = within(t, T.celebrate, T.boothC + 0.1)
  if (!showPre && !showParty) return null
  const fadeIn = showPre ? prog(t, T.fieldIn, T.fieldIn + 0.25) : prog(t, T.celebrate, T.celebrate + 0.15)
  const fadeOut = showPre ? prog(t, T.cardIn, T.cardIn + 0.25) : prog(t, T.boothC - 0.05, T.boothC + 0.1)
  const list = bodies(t).sort((a, b) => fy(a.lat) - fy(b.lat))
  const fh = FIELD_BOT - FIELD_TOP

  const stripes: ReactNode[] = []
  for (let y = LOS + 15; y > LOS - 25; y -= 5) {
    stripes.push(<rect key={`s${y}`} x={fx(y)} y={0} width={5 * PX_YD} height={fh} fill={((y / 5) % 2 === 0) ? '#1d6b3a' : '#195f33'} />)
  }
  const lines = [60, 55, 50, 45, 40, 35, 30].map((y) => <rect key={`l${y}`} x={fx(y) - 1} y={0} width={y === 50 ? 3 : 2} height={fh} fill="rgba(242,239,228,0.7)" />)
  const hashes: ReactNode[] = []
  for (let y = LOS + 12; y >= LOS - 20; y--) {
    if (y % 5 === 0) continue
    hashes.push(<rect key={`h${y}`} x={fx(y) - 0.5} y={92} width={1.5} height={9} fill="rgba(242,239,228,0.55)" />)
    hashes.push(<rect key={`g${y}`} x={fx(y) - 0.5} y={186} width={1.5} height={9} fill="rgba(242,239,228,0.55)" />)
  }
  // On the turnover the camera pushes in on the celebrating defense.
  const zoom = showParty ? 1 + 0.14 * easeOut(prog(t, T.celebrate, T.celebrate + 1.2)) : 1
  return (
    <div className="ad-field" style={{ opacity: fadeIn * (1 - fadeOut) }}>
      <div className="ad-cam" style={{ transform: `scale(${zoom})`, transformOrigin: `${fx(LOS - 6)}px ${fy(0.45) - FIELD_TOP}px` }}>
        <svg className="ad-field-svg" viewBox={`0 0 ${FW} ${fh}`} width={FW} height={fh}>
          {stripes}
          {lines}
          {hashes}
          <text x={fx(60)} y={262} className="ad-yd-num" textAnchor="middle">4 0</text>
          <text x={fx(50)} y={262} className="ad-yd-num" textAnchor="middle">5 0</text>
          <text x={fx(40)} y={262} className="ad-yd-num" textAnchor="middle">4 0</text>
          {!showParty && <rect x={fx(LOS) - 1.5} y={0} width={3} height={fh} fill="#3aa0ff" style={{ filter: 'drop-shadow(0 0 4px #3aa0ff)' }} />}
          {!showParty && <rect x={fx(LOS - 10) - 1.5} y={0} width={3} height={fh} fill="#ffd23f" style={{ filter: 'drop-shadow(0 0 4px #ffd23f)' }} />}
        </svg>
        <div className="ad-players">
          {list.map((b) => {
            const s = spriteUrl(b.pose, b.team, b.skin)
            const w = s.w * SCALE, h = s.h * SCALE
            return (
              <img
                key={b.key}
                src={s.url}
                className="ad-pl"
                style={{ left: fx(b.ytg) - w / 2, top: fy(b.lat) - FIELD_TOP - h - (b.hop ?? 0), width: w, height: h, transform: b.flip ? 'scaleX(-1)' : undefined }}
                alt=""
              />
            )
          })}
        </div>
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
  const visible = within(t, T.cardIn, T.snap3 + 0.12) && !within(t, T.boothA, T.boothAOut) && !within(t, T.boothB, T.boothBOut)
  if (!visible) return null
  const enter = t < T.boothA ? prog(t, T.cardIn, T.cardIn + 0.35)
    : t < T.boothB ? prog(t, T.boothAOut, T.boothAOut + 0.18)
      : t < T.snap3 ? prog(t, T.boothBOut, T.boothBOut + 0.18) : 1 - prog(t, T.snap3 + 0.02, T.snap3 + 0.12)
  const clock = clockAt(t)
  const secs = Math.max(0, Math.ceil(clock - 0.001))
  const urgent = secs <= 5
  const blinkOn = !urgent || t >= T.freeze || Math.floor(t * 2) % 2 === 0
  const used = guessesIn(t)
  const text = inputText(t)
  const typing = t >= T.typeAllen - 0.3
  const caret = typing && t < T.snap3 && Math.floor(t * 2.6) % 2 === 0
  const pressed = GUESSES.some((g) => within(t, g.snap, g.snap + 0.15))
  // The card shakes on each wrong answer, like the game's .shaking animation.
  const lastMiss = [...GUESSES].reverse().find((g) => t >= g.snap)
  const sp = lastMiss ? prog(t, lastMiss.snap, lastMiss.snap + 0.42) : 1
  const shakeX = sp < 1 ? Math.sin(sp * Math.PI * 7) * 9 * (1 - sp) : 0
  const freeze = prog(t, T.freeze, T.freeze + 0.3)
  const notice = noticeText(t)
  const noticeIn = lastMiss ? prog(t, lastMiss.snap, lastMiss.snap + 0.12) : 0
  return (
    <section
      className={`play-card ad-card tod-card ${urgent ? 'urgent' : ''}`}
      style={{ opacity: enter, transform: `translate(${shakeX}px, ${(1 - easeOut(enter)) * 18}px) scale(${1 + freeze * 0.04})` }}
    >
      <div className="play-card-top">
        <span className="tag">DRIVE #5 · PLAY 1</span>
        <span className="tag tag-cat">SUPER BOWL</span>
      </div>
      <h1 className="prompt-text ad-prompt tod-prompt">Name a quarterback who started and won a Super Bowl</h1>
      <div className="clock-row">
        <div className={`play-clock ${urgent ? 'urgent' : ''}`}>
          <span className="sb-label">PLAY CLOCK</span>
          <span className="led" style={{ opacity: blinkOn ? 1 : 0.55 }}>{String(secs).padStart(2, '0')}</span>
        </div>
        <div className="downs">
          {DOWN_LABELS.map((d, i) => (
            <span key={d} className={`down ${i < used ? 'used' : ''} ${i === used ? 'now' : ''}`}>{d}</span>
          ))}
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
      <p className="notice miss tod-notice" style={{ opacity: notice ? noticeIn : 0 }}>{notice ?? ' '}</p>
    </section>
  )
}

// ---------- Broadcast booth ----------
const BOOTHS: [number, number][] = [[T.boothA, T.boothAOut], [T.boothB, T.boothBOut], [T.boothC, T.endCard]]

function talking(who: 'PBP' | 'COLOR', t: number): boolean {
  const line = LINES.find((l) => l.who === who && !l.voiceOnly && within(t, l.start, l.end))
  if (!line) return false
  const typingFor = line.text.length / (line.cps ?? 30) + 0.25
  return t - line.start < typingFor && Math.floor(t * 9) % 2 === 0
}

function Booth({ t }: { t: number }) {
  const seg = BOOTHS.findIndex(([a, b]) => within(t, a, b))
  if (seg < 0) return null
  const [a] = BOOTHS[seg]
  const enter = prog(t, a, a + 0.15)
  const pbpTalk = talking('PBP', t)
  const colorTalk = talking('COLOR', t)
  // A and B: the color guy jumps up, hyped and outraged. C: both crack up.
  const laughing = seg === 2
  const colorPose: BoothPose = laughing ? (Math.floor(t * 6) % 2 === 0 ? 'hype' : 'open') : t - a < 0.9 ? 'hype' : colorTalk ? 'open' : 'closed'
  const pbpPose: BoothPose = laughing ? (Math.floor(t * 5 + 1) % 2 === 0 ? 'open' : 'closed') : pbpTalk ? 'open' : 'closed'
  const colorHop = laughing ? Math.abs(Math.sin((t - a) * 10)) * 5 : Math.abs(Math.sin((t - a) * 14)) * 10 * (1 - prog(t, a + 0.6, a + 1.0))
  const pbpLean = laughing ? Math.sin(t * 12) * 3 : -6 * (1 - prog(t, a + 0.6, a + 1.0))
  const zoom = seg === 2 ? 1 : 1 + 0.12 * easeOut(prog(t, a, a + 0.25))
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
      {seg === 2 && <StatPop t={t} />}
    </div>
  )
}

/** Super Bowl starts for the three guesses: zero, zero, zero. */
function StatPop({ t }: { t: number }) {
  if (t < T.statPop) return null
  const p = easeBack(prog(t, T.statPop, T.statPop + 0.3))
  const names = ['ALLEN', 'LAMAR', 'DAK']
  return (
    <div className="ad-tier-pop tod-stat" style={{ opacity: clamp(p), transform: `translateX(-50%) scale(${0.7 + 0.3 * p})` }}>
      <div className="tod-stat-head">SUPER BOWL STARTS</div>
      <div className="tod-stat-row">
        {names.map((n, i) => {
          const q = easeBack(prog(t, T.statPop + 0.35 + i * 0.28, T.statPop + 0.6 + i * 0.28))
          return (
            <div key={n} className="tod-stat-cell" style={{ opacity: clamp(q * 1.5) }}>
              <span className="tod-stat-name">{n}</span>
              <span className="led tod-stat-num" style={{ transform: `scale(${0.5 + 0.5 * q})` }}>0</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Turnover on Downs reveal (same markup as the game's miss reveal) ----------
function Reveal({ t }: { t: number }) {
  if (!within(t, T.snap3, T.revealOut)) return null
  const m = MISS.turnover
  const p = easeBack(prog(t, T.snap3 + 0.05, T.snap3 + 0.32))
  const sub = prog(t, T.snap3 + 0.45, T.snap3 + 0.65)
  const out = prog(t, T.revealOut - 0.12, T.revealOut)
  return (
    <section className="reveal miss ad-reveal tod-reveal" style={{ ['--tier' as string]: '#8b938e', opacity: 1 - out } as CSSProperties}>
      <span className="tod-stamp-sq" style={{ transform: `scale(${2.4 - 1.4 * p}) rotate(${-8 + 8 * p}deg)`, opacity: clamp(p * 2) }} />
      <h2 className="reveal-title tod-reveal-title" style={{ transform: `scale(${2 - p}) rotate(-3deg)`, opacity: clamp(p * 2) }}>{m.name}</h2>
      <p className="reveal-answer" style={{ opacity: sub }}>“Dak Prescott”</p>
      <p className="reveal-gain" style={{ opacity: sub }}>
        <span className="pts">+0 PTS</span> · <span>+0 YDS</span>
      </p>
      <p className="reveal-blurb" style={{ opacity: sub }}>{m.blurb}</p>
    </section>
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
    <div className="ad-chyron tod-chyron" style={{ opacity: first }}>
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
  const q = easeBack(s(1.3, 0.35))
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
      <p className="tod-end-q" style={{ opacity: clamp(q * 2), transform: `scale(${0.7 + 0.3 * q})` }}>Who should he<br />have said?</p>
      <p className="ad-end-rule" style={{ opacity: s(2.45) }}>Rarer answers gain more yards</p>
      <div className="btn btn-hero ad-end-cta" style={{ opacity: s(2.85), transform: `translateY(${(1 - easeOut(s(2.85))) * 12}px)` }}>
        PLAY FREE ▸ 4THANDLONG.IO
      </div>
    </div>
  )
}

// ---------- The frame ----------
export function TurnoverOnDowns({ t }: { t: number }) {
  const freeze = within(t, T.freeze, T.snap3) ? prog(t, T.freeze, T.freeze + 0.15) : 0
  // Red flash on each wrong answer (the game's fx.flash), bigger on the turnover.
  const missFlash = GUESSES.reduce((acc, g, i) => {
    const big = i === GUESSES.length - 1
    return within(t, g.snap, g.snap + 0.35) ? Math.max(acc, (big ? 0.4 : 0.22) * (1 - prog(t, g.snap, g.snap + 0.35))) : acc
  }, 0)
  const flashW = within(t, T.endCard, T.endCard + 0.3) ? 0.5 * (1 - prog(t, T.endCard, T.endCard + 0.3)) : 0
  // A small jolt on the turnover stamp.
  const sp = prog(t, T.snap3, T.snap3 + 0.45)
  const shake = sp > 0 && sp < 1 ? (1 - sp) * 7 : 0
  const sx = Math.sin(t * 97) * shake, sy = Math.cos(t * 83) * shake * 0.7
  const clock = clockAt(t)
  const urgent = within(t, T.boothBOut, T.freeze) && clock <= 5
  const beat = t % 1
  const vignette = urgent ? (beat < 0.15 ? 0.35 + beat / 0.15 * 0.65 : beat < 0.3 ? 1 - (beat - 0.15) / 0.15 * 0.5 : beat < 0.45 ? 0.5 + (beat - 0.3) / 0.15 * 0.4 : 0.9 - (beat - 0.45) / 0.55 * 0.55)
    : freeze ? 0.6 : 0
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
        <EndCard t={t} />
        <div className="ad-vignette" style={{ opacity: vignette }} />
      </div>
      <Chyron t={t} />
      <div className="ad-flash" style={{ background: '#ff3b30', opacity: missFlash }} />
      <div className="ad-flash" style={{ background: '#fff', opacity: flashW }} />
      <div className="ad-flash" style={{ background: '#000', opacity: t < T.lightsOn ? 1 : fade }} />
    </div>
  )
}
