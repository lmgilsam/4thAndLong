import { useEffect, useState } from 'react'
import { GAME_SUBTITLE, SHARE_URL } from '../config'
import type { PromptDef } from '../data/types'
import { rarestAnswers } from '../engine/match'
import { msUntilNextDrive } from '../engine/schedule'
import type { DriveState, Stats } from '../engine/storage'
import { driveOutcome, MAX_SCORE, MISS, START_YARD_LINE, TIERS } from '../engine/tiers'
import { backendEnabled, fetchDistribution, type Distribution } from '../lib/backend'
import { totals } from './Drive'

function useCountdown() {
  const [ms, setMs] = useState(() => msUntilNextDrive())
  useEffect(() => {
    const t = setInterval(() => setMs(msUntilNextDrive()), 1000)
    return () => clearInterval(t)
  }, [])
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function buildShareText(state: DriveState, label: string): string {
  const { score, yards } = totals(state.results)
  const o = driveOutcome(yards)
  const squares = state.results.map((r) => (r.tier ? TIERS[r.tier].emoji : MISS[r.outcome as 'delay'].emoji)).join('')
  return `${GAME_SUBTITLE} ${label} 🏈\n${score} pts · ${o.label}\n${squares}\n${SHARE_URL}`
}

function DriveChart({ state }: { state: DriveState }) {
  let start = 0
  return (
    <div className="drive-chart" role="img" aria-label="Drive chart showing yards gained on each play">
      <div className="dc-axis">
        {[50, 40, 30, 20, 10, 0].map((m) => (
          <span key={m} style={{ left: `${((50 - m) / 50) * 100}%` }}>{m === 0 ? 'G' : m}</span>
        ))}
      </div>
      {state.results.map((r, i) => {
        const from = start
        start += r.yards
        const color = r.tier ? TIERS[r.tier].color : '#59605c'
        return (
          <div className="dc-row" key={i}>
            <span className="dc-num">{i + 1}</span>
            <div className="dc-track">
              {r.yards > 0 ? (
                <span
                  className="dc-bar"
                  style={{ left: `${(from / START_YARD_LINE) * 100}%`, width: `${(r.yards / START_YARD_LINE) * 100}%`, background: color, boxShadow: `0 0 10px ${color}66`, animationDelay: `${i * 90}ms` }}
                />
              ) : (
                <span className="dc-x" style={{ left: `${(from / START_YARD_LINE) * 100}%` }}>✕</span>
              )}
            </div>
            <span className="dc-gain" style={{ color }}>{r.yards > 0 ? `+${r.yards}` : '0'}</span>
          </div>
        )
      })}
    </div>
  )
}

function DistributionChart({ dist, score }: { dist: Distribution; score: number }) {
  const max = Math.max(...dist.buckets.map((b) => b.players), 1)
  const buckets = Array.from({ length: MAX_SCORE / 25 + 1 }, (_, i) => i * 25)
  return (
    <div className="dist">
      <div className="dist-bars">
        {buckets.map((b) => {
          const n = dist.buckets.find((x) => x.bucket === b)?.players ?? 0
          const mine = score >= b && score < b + 25
          return <span key={b} className={`dist-bar ${mine ? 'mine' : ''}`} style={{ height: `${(n / max) * 100}%` }} title={`${b}-${b + 24}: ${n}`} />
        })}
      </div>
      <div className="dist-axis"><span>0</span><span>350</span><span>700</span></div>
      <p className="dist-caption">
        Better than <strong>{dist.percentile}%</strong> of today’s {dist.total.toLocaleString()} drives
      </p>
    </div>
  )
}

export function Results({ state, prompts, label, stats, mode, onHome, onPractice }: {
  state: DriveState
  prompts: PromptDef[]
  label: string
  stats?: Stats
  mode: 'daily' | 'practice'
  onHome: () => void
  onPractice: () => void
}) {
  const { score, yards } = totals(state.results)
  const outcome = driveOutcome(yards)
  const [copied, setCopied] = useState(false)
  const [manualCopy, setManualCopy] = useState<string | null>(null)
  const [dist, setDist] = useState<Distribution | null>(null)
  const countdown = useCountdown()

  useEffect(() => {
    if (mode !== 'daily') return
    let alive = true
    // Give submit_drive a moment to land before reading the histogram.
    const t = setTimeout(() => fetchDistribution(state.date, score).then((d) => alive && setDist(d)), 600)
    return () => { alive = false; clearTimeout(t) }
  }, [mode, state.date, score])

  async function share() {
    const text = buildShareText(state, label)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
      setManualCopy(text)
    }
  }

  return (
    <div className="results">
      <div className="results-head">
        <span className="tag">{label} {mode === 'practice' ? '· PRACTICE' : 'COMPLETE'}</span>
      </div>

      <section className={`outcome outcome-${outcome.kind}`}>
        <h1 className="outcome-label">{outcome.label}</h1>
        <p className="outcome-detail">{outcome.detail}</p>
        <div className="final-numbers">
          <div><span className="led big">{score}</span><span className="sb-label">POINTS</span></div>
          <div><span className="led big">{yards}</span><span className="sb-label">YARDS</span></div>
        </div>
        <button className="btn btn-primary" onClick={share}>{copied ? 'COPIED ✓' : 'SHARE RESULT'}</button>
        {manualCopy && (
          <textarea className="manual-copy" readOnly value={manualCopy} rows={4} onFocus={(e) => e.currentTarget.select()} aria-label="Your result, ready to copy" />
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">DRIVE CHART <span>longer bar = rarer answer</span></h3>
        <DriveChart state={state} />
      </section>

      {mode === 'daily' && (
        <section className="panel">
          <h3 className="panel-title">VS. EVERYONE TODAY</h3>
          {dist ? (
            <DistributionChart dist={dist} score={score} />
          ) : (
            <p className="muted small">
              {backendEnabled ? 'Loading today’s scores…' : 'Global standings turn on once the game is connected to its database.'}
            </p>
          )}
        </section>
      )}

      <section className="panel">
        <h3 className="panel-title">PLAY BY PLAY</h3>
        <ol className="pbp">
          {state.results.map((r, i) => {
            const p = prompts.find((x) => x.id === r.promptId)
            const t = r.tier ? TIERS[r.tier] : null
            const best = p ? rarestAnswers(p, 1)[0] : null
            return (
              <li key={i}>
                <p className="pbp-q">{p?.text}</p>
                <p className="pbp-a">
                  <span className="pill" style={{ color: t?.color ?? '#8b938e', borderColor: t?.color ?? '#59605c' }}>
                    {t ? t.name : MISS[r.outcome as 'delay'].name}
                  </span>
                  <span>{r.answerName ?? (r.guesses.length ? r.guesses.join(', ') : 'no answer')}</span>
                </p>
                {best && best.name !== r.answerName && (
                  <p className="pbp-best">Rare pick on the board: <strong>{best.name}</strong></p>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {mode === 'daily' && stats && (
        <section className="panel stats">
          <div><span className="led">{stats.played}</span><span className="sb-label">DRIVES</span></div>
          <div><span className="led">{stats.streak}</span><span className="sb-label">STREAK</span></div>
          <div><span className="led">{stats.best}</span><span className="sb-label">BEST</span></div>
          <div><span className="led">{stats.touchdowns}</span><span className="sb-label">TDS</span></div>
        </section>
      )}

      <section className="next-drive">
        <span className="sb-label">NEXT DRIVE IN</span>
        <span className="led">{countdown}</span>
        <div className="row-btns">
          <button className="btn btn-ghost" onClick={onPractice}>PRACTICE DRIVE</button>
          <button className="btn btn-ghost" onClick={onHome}>HOME</button>
        </div>
      </section>
    </div>
  )
}
