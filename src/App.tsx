import { useCallback, useEffect, useMemo, useState } from 'react'
import { GAME_NAME, GAME_SUBTITLE } from './config'
import { Drive, totals, type Session } from './components/Drive'
import { HowToPlay } from './components/HowToPlay'
import { Results } from './components/Results'
import { dateForDrive, driveNumber, getPrompt, promptsForDrive, randomPractice, todayKey } from './engine/schedule'
import {
  hasSeenHelp, liveStreak, loadDrive, loadStats, markHelpSeen, playerId, recordFinishedDrive,
  type DriveState, type Stats,
} from './engine/storage'
import { driveOutcome, PLAY_CLOCK_SECONDS, PLAYS_PER_DRIVE } from './engine/tiers'
import { submitDrive } from './lib/backend'
import type { PromptDef } from './data/types'

type View = 'home' | 'drive' | 'results'

interface Active {
  session: Session
  state: DriveState
}

function freshState(date: string, driveNo: number, prompts: PromptDef[]): DriveState {
  return { date, driveNo, promptIds: prompts.map((p) => p.id), results: [] }
}

/** "#drive-12" replays an earlier drive as practice (handy for testing and an archive). */
function hashDrive(): number | null {
  const m = /^#drive-(\d+)$/.exec(window.location.hash)
  return m ? Number(m[1]) : null
}

export default function App() {
  const today = useMemo(() => todayKey(), [])
  const driveNo = driveNumber(today)
  const dailyPrompts = useMemo(() => promptsForDrive(driveNo), [driveNo])

  const [view, setView] = useState<View>('home')
  const [active, setActive] = useState<Active | null>(null)
  const [stats, setStats] = useState<Stats>(() => loadStats())
  const [help, setHelp] = useState(false)

  const saved = loadDrive(today)
  const dailyDone = Boolean(saved && (saved.finished || saved.results.length >= PLAYS_PER_DRIVE))
  const dailyInProgress = Boolean(saved && !dailyDone && (saved.results.length > 0 || saved.current))

  const startDaily = useCallback(() => {
    const s = loadDrive(today)
    // Prompts come from the saved drive if one exists, so a pool update mid-day can't swap them.
    const prompts = s ? (s.promptIds.map(getPrompt).filter(Boolean) as PromptDef[]) : dailyPrompts
    const state = s ?? freshState(today, driveNo, prompts)
    setActive({ session: { mode: 'daily', label: `DRIVE #${driveNo}`, prompts }, state })
    setView(state.finished || state.results.length >= PLAYS_PER_DRIVE ? 'results' : 'drive')
    if (!hasSeenHelp()) setHelp(true)
  }, [today, driveNo, dailyPrompts])

  const startPractice = useCallback((replay?: number) => {
    const prompts = replay ? promptsForDrive(replay) : randomPractice()
    const label = replay ? `DRIVE #${replay}` : 'PRACTICE'
    const date = replay ? dateForDrive(replay) : today
    setActive({ session: { mode: 'practice', label, prompts }, state: freshState(date, replay ?? 0, prompts) })
    setView('drive')
  }, [today])

  useEffect(() => {
    const route = () => {
      const n = hashDrive()
      if (n) startPractice(n)
      else if (window.location.hash === '#practice') startPractice()
    }
    route()
    window.addEventListener('hashchange', route)
    return () => window.removeEventListener('hashchange', route)
  }, [startPractice])

  const onComplete = useCallback((s: DriveState) => {
    if (!active) return
    setActive({ ...active, state: s })
    if (active.session.mode === 'daily') {
      const { score, yards } = totals(s.results)
      setStats(recordFinishedDrive(s.date, score, driveOutcome(yards).kind === 'td'))
      void submitDrive({ date: s.date, player: playerId(), score, yards, plays: s.results })
    }
    setView('results')
  }, [active])

  const closeHelp = useCallback(() => { setHelp(false); markHelpSeen() }, [])

  const goHome = () => {
    if (window.location.hash) history.replaceState(null, '', window.location.pathname)
    setView('home')
    setActive(null)
  }

  return (
    <div className={`app view-${view}`}>
      <Stadium />
      <main className="stage">
        {view === 'home' && (
          <Home
            driveNo={driveNo}
            streak={liveStreak(today)}
            done={dailyDone}
            inProgress={dailyInProgress}
            onStart={startDaily}
            onPractice={() => startPractice()}
            onHelp={() => setHelp(true)}
          />
        )}
        {view === 'drive' && active && (
          <Drive key={active.session.label + active.state.date} session={active.session} initial={active.state} onComplete={onComplete} />
        )}
        {view === 'results' && active && (
          <Results
            state={active.state}
            prompts={active.session.prompts}
            label={active.session.label}
            mode={active.session.mode}
            stats={active.session.mode === 'daily' ? stats : undefined}
            onHome={goHome}
            onPractice={() => startPractice()}
          />
        )}
      </main>
      {view !== 'home' && (
        <button className="corner-btn" onClick={goHome} aria-label="Back to home">◀ HOME</button>
      )}
      {help && <HowToPlay onClose={closeHelp} />}
    </div>
  )
}

function Home({ driveNo, streak, done, inProgress, onStart, onPractice, onHelp }: {
  driveNo: number
  streak: number
  done: boolean
  inProgress: boolean
  onStart: () => void
  onPractice: () => void
  onHelp: () => void
}) {
  return (
    <div className="home">
      <div className="title-block">
        <p className="kicker">EST. 2026 · HOUSTON, TX</p>
        <h1 className="game-title" aria-label={GAME_NAME}>
          {GAME_NAME.split(' ').map((w, i) => <span key={i}>{w}</span>)}
        </h1>
        <p className="subtitle led">{GAME_SUBTITLE}</p>
        <p className="tagline">
          {PLAYS_PER_DRIVE} plays <i>·</i> {PLAY_CLOCK_SECONDS}-second play clock <i>·</i> rarer answers gain more yards
        </p>
      </div>

      <div className="home-actions">
        <button className="btn btn-hero" onClick={onStart}>
          {done ? `VIEW DRIVE #${driveNo}` : inProgress ? `RESUME DRIVE #${driveNo}` : `START DRIVE #${driveNo}`}
          <span aria-hidden="true"> ▸</span>
        </button>
        <div className="home-meta">
          <span>DRIVE #{driveNo}</span>
          <span>STREAK {streak}</span>
        </div>
        <div className="row-btns">
          <button className="btn btn-ghost" onClick={onHelp}>HOW TO PLAY</button>
          <button className="btn btn-ghost" onClick={onPractice}>PRACTICE</button>
        </div>
      </div>
    </div>
  )
}

function Stadium() {
  return (
    <div className="stadium" aria-hidden="true">
      <div className="sky" />
      <div className="lights left" />
      <div className="lights right" />
      <div className="crowd" />
      <div className="field-perspective">
        <div className="field-plane" />
      </div>
    </div>
  )
}
