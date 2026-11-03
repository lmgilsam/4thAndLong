import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PromptDef } from '../data/types'
import { matchAnswer, normalize } from '../engine/match'
import { ensureAnswers } from '../data/team-prompts'
import { saveDrive, type DriveState, type PlayResult } from '../engine/storage'
import { DOWNS_PER_PLAY, MISS, PLAY_CLOCK_SECONDS, TIERS } from '../engine/tiers'
import { fx } from '../lib/fx'
import { sound } from '../lib/sound'
import { useCountUp } from '../lib/useCountUp'
import { FieldStrip } from './FieldStrip'
import { RouteArt } from './RouteArt'
import { Scoreboard } from './Scoreboard'

const PRESNAP_MS = 2700
const DOWN_LABELS = ['1ST', '2ND', '3RD']

export interface Session {
  mode: 'daily' | 'practice'
  label: string
  prompts: PromptDef[]
}

export function totals(results: PlayResult[]) {
  return results.reduce((t, r) => ({ score: t.score + r.points, yards: t.yards + r.yards }), { score: 0, yards: 0 })
}

export function Drive({ session, initial, onComplete }: {
  session: Session
  initial: DriveState
  onComplete: (s: DriveState) => void
}) {
  const [state, setState] = useState<DriveState>(initial)
  const [revealing, setRevealing] = useState<PlayResult | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [input, setInput] = useState('')
  const [notice, setNotice] = useState<{ text: string; tone: 'miss' | 'info' } | null>(null)
  const [shaking, setShaking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(() => session.prompts.every((p) => !p.src || p.answers.length > 0))
  const [loadError, setLoadError] = useState(false)
  const [loadTry, setLoadTry] = useState(0)

  // Team prompts fetch their (large) answer lists before the drive starts.
  useEffect(() => {
    if (ready) return
    let alive = true
    Promise.all(session.prompts.map(ensureAnswers))
      .then(() => alive && setReady(true))
      .catch(() => alive && setLoadError(true))
    return () => { alive = false }
  }, [ready, session.prompts, loadTry])

  const persist = useCallback((s: DriveState) => {
    setState(s)
    if (session.mode === 'daily') saveDrive(s)
  }, [session.mode])

  const index = state.results.length
  const prompt = session.prompts[index]
  const { score, yards } = totals(state.results)

  // Start (or resume) the clock for the current play.
  useEffect(() => {
    if (!ready || revealing || state.finished || !prompt) return
    if (state.current?.index === index) return
    persist({ ...state, current: { index, startedAt: Date.now() + PRESNAP_MS, guesses: [] } })
  }, [ready, index, prompt, revealing, state, persist])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [])

  const cur = state.current?.index === index ? state.current : undefined
  const msLeft = cur ? cur.startedAt + PLAY_CLOCK_SECONDS * 1000 - now : PLAY_CLOCK_SECONDS * 1000
  const presnapLeft = cur ? cur.startedAt - now : PRESNAP_MS
  const phase: 'presnap' | 'live' | 'reveal' = revealing ? 'reveal' : presnapLeft > 0 ? 'presnap' : 'live'
  const guesses = cur?.guesses ?? []

  const finishPlay = useCallback((result: PlayResult) => {
    const results = [...state.results, result]
    persist({ ...state, results, current: undefined })
    setRevealing(result)
    setInput('')
    setNotice(null)
  }, [state, persist])

  // Play clock expired.
  useEffect(() => {
    if (phase === 'live' && msLeft <= 0 && prompt) {
      sound.buzzer()
      fx.flash('#ff3b30', 0.22)
      finishPlay({ promptId: prompt.id, outcome: 'delay', points: 0, yards: 0, guesses })
    }
  }, [phase, msLeft, prompt, guesses, finishPlay])

  useEffect(() => {
    if (phase === 'live') inputRef.current?.focus()
  }, [phase, index])

  function celebrateHit(tier: number, color: string) {
    sound.hit(tier)
    if (tier >= 3) {
      fx.confetti({ colors: [color, '#f2efe4', '#ffb627'], count: tier === 3 ? 40 : tier === 4 ? 80 : 150, y: 0.42, power: 0.7 + tier * 0.12, footballs: tier === 5 })
    }
    if (tier === 5) { fx.flash(color, 0.4); fx.quake() }
    else if (tier === 4) fx.flash(color, 0.2)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (phase !== 'live' || !prompt || !cur) return
    const raw = input.trim()
    if (!raw) return
    const res = matchAnswer(prompt, raw)
    if (res.kind === 'hit') {
      const t = TIERS[res.answer.tier]
      celebrateHit(t.id, t.color)
      finishPlay({ promptId: prompt.id, outcome: 'hit', answerName: res.answer.name, input: raw, tier: t.id, points: t.points, yards: t.yards, guesses: [...guesses, raw] })
      return
    }
    if (res.kind === 'ambiguous') {
      const firsts = [...new Set(res.options.map((o) => o.name.split(' ')[0]))]
      setNotice({
        text: firsts.length <= 4
          ? `Which one? ${firsts.join(' or ')}? Be more specific.`
          : `${res.options.length} players match that name. Add a first name.`,
        tone: 'info',
      })
      return
    }
    if (guesses.some((g) => normalize(g) === normalize(raw))) {
      setNotice({ text: 'Already ran that play. Try something else.', tone: 'info' })
      return
    }
    const nextGuesses = [...guesses, raw]
    if (nextGuesses.length >= DOWNS_PER_PLAY) {
      sound.buzzer()
      fx.flash('#ff3b30', 0.22)
      finishPlay({ promptId: prompt.id, outcome: 'turnover', points: 0, yards: 0, guesses: nextGuesses })
      return
    }
    persist({ ...state, current: { ...cur, guesses: nextGuesses } })
    setInput('')
    sound.miss()
    fx.flash('#ff3b30', 0.14)
    setShaking(true)
    setTimeout(() => setShaking(false), 420)
    setNotice({ text: `"${raw}" isn't on the board. ${DOWN_LABELS[nextGuesses.length]} down.`, tone: 'miss' })
  }

  function nextPlay() {
    setRevealing(null)
    if (state.results.length >= session.prompts.length) {
      const done = { ...state, finished: true }
      persist(done)
      onComplete(done)
    }
  }

  const clockSecs = Math.max(0, Math.ceil(msLeft / 1000))
  const clockPct = Math.max(0, Math.min(1, msLeft / (PLAY_CLOCK_SECONDS * 1000)))
  const presnapWord = presnapLeft > 1800 ? 'READY' : presnapLeft > 900 ? 'SET' : 'HUT!'
  const isLast = state.results.length >= session.prompts.length
  const urgent = ready && phase === 'live' && clockSecs <= 5

  // Cadence on READY / SET / HUT, whistle at the snap.
  const prevPhase = useRef(phase)
  useEffect(() => {
    if (ready && phase === 'presnap') sound.cadence(presnapWord)
  }, [ready, phase, presnapWord])
  useEffect(() => {
    if (prevPhase.current === 'presnap' && phase === 'live') sound.whistle()
    prevPhase.current = phase
  }, [phase])
  // Ticks for the last five seconds.
  useEffect(() => {
    if (ready && phase === 'live' && clockSecs > 0 && clockSecs <= 5) sound.tick(clockSecs)
  }, [ready, phase, clockSecs])

  const shownPts = useCountUp(revealing?.points ?? 0, 650, 0)

  const revealMeta = useMemo(() => {
    if (!revealing) return null
    if (revealing.tier) {
      const t = TIERS[revealing.tier]
      return { title: t.name, color: t.color, blurb: t.blurb, tier: t.id, miss: false }
    }
    const m = MISS[revealing.outcome as 'turnover' | 'delay']
    return { title: m.name, color: '#8b938e', blurb: m.blurb, tier: undefined, miss: true }
  }, [revealing])

  return (
    <div className="drive">
      <Scoreboard results={state.results} current={revealing ? index - 1 : index} score={score} yards={yards} />
      <FieldStrip
        yards={yards}
        compact
        gain={revealing ? { yards: revealing.yards, color: revealMeta?.color ?? '#fff', key: index } : undefined}
      />
      {urgent && <div className="urgent-vignette" aria-hidden="true" />}

      {!ready && (
        <section className="play-card loading-card">
          {loadError ? (
            <>
              <p className="notice miss">Couldn't load today's team roster. Check your connection.</p>
              <button className="btn btn-primary" onClick={() => { setLoadError(false); setLoadTry((n) => n + 1) }}>TRY AGAIN</button>
            </>
          ) : (
            <span className="presnap-word">HUDDLE…</span>
          )}
        </section>
      )}

      {ready && phase !== 'reveal' && prompt && (
        <section className={`play-card ${phase} ${shaking ? 'shaking' : ''} ${urgent ? 'urgent' : ''}`} key={index}>
          <div className="play-card-top">
            <span className="tag">{session.label} · PLAY {index + 1}</span>
            <span className="tag tag-cat">{prompt.tag}</span>
          </div>
          <h1 className="prompt-text">{prompt.text}</h1>
          <p className="hint">▸ rarer answers gain more yards</p>

          {phase === 'presnap' ? (
            <div className="presnap" aria-live="polite">
              <span key={presnapWord} className="presnap-word">{presnapWord}</span>
              <span className="presnap-sub">play clock starts at the snap</span>
            </div>
          ) : (
            <>
              <div className="clock-row">
                <div className={`play-clock ${clockSecs <= 5 ? 'urgent' : ''}`} aria-label={`${clockSecs} seconds left`}>
                  <span className="sb-label">PLAY CLOCK</span>
                  <span className="led">{String(clockSecs).padStart(2, '0')}</span>
                </div>
                <div className="downs" aria-label={`${DOWN_LABELS[guesses.length]} down`}>
                  {DOWN_LABELS.map((d, i) => (
                    <span key={d} className={`down ${i < guesses.length ? 'used' : ''} ${i === guesses.length ? 'now' : ''}`}>{d}</span>
                  ))}
                  <span className="sb-label">DOWN</span>
                </div>
              </div>
              <div className="clock-bar"><span style={{ transform: `scaleX(${clockPct})` }} /></div>
              <form className="answer-form" onSubmit={submit}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Call your play…"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  enterKeyHint="go"
                  aria-label="Your answer"
                />
                <button type="submit" className="btn btn-snap">SNAP</button>
              </form>
              <p className={`notice ${notice?.tone ?? ''}`} role="status">{notice?.text ?? ' '}</p>
            </>
          )}
        </section>
      )}

      {phase === 'reveal' && revealing && revealMeta && (
        <section className={`reveal ${revealMeta.tier ? `tier-${revealMeta.tier}` : 'miss'}`} style={{ ['--tier' as string]: revealMeta.color }}>
          {revealMeta.tier && revealMeta.tier >= 3 && <div className="reveal-burst" aria-hidden="true" />}
          <RouteArt tier={revealMeta.tier} color={revealMeta.color} miss={revealMeta.miss} />
          <h2 className="reveal-title">{revealMeta.title}</h2>
          <p className="reveal-answer">{revealing.answerName ? `“${revealing.answerName}”` : '—'}</p>
          <p className="reveal-gain">
            <span className="pts">+{shownPts} PTS</span> · <span>+{revealing.yards} YDS</span>
          </p>
          <p className="reveal-blurb">{revealMeta.blurb}</p>
          <button className="btn btn-primary" onClick={nextPlay} autoFocus>
            {isLast ? 'SEE THE DRIVE ▸' : 'NEXT PLAY ▸'}
          </button>
        </section>
      )}
    </div>
  )
}
