import { useCallback, useEffect, useMemo, useState } from 'react'
import { GAME_NAME, GAME_SUBTITLE } from './config'
import { Drive, totals, type Session } from './components/Drive'
import { Effects } from './components/Effects'
import { Teams } from './components/Teams'
import { HowToPlay } from './components/HowToPlay'
import { InstallButton } from './components/InstallApp'
import { Results } from './components/Results'
import { dateForDrive, driveNumber, getPrompt, promptsForDrive, randomPractice, todayKey } from './engine/schedule'
import {
  hasSeenHelp, liveStreak, loadDrive, loadStats, markHelpSeen, playerId, recordFinishedDrive,
  type DriveState, type Stats,
} from './engine/storage'
import { driveOutcome, PLAY_CLOCK_SECONDS, PLAYS_PER_DRIVE } from './engine/tiers'
import { submitDrive } from './lib/backend'
import { isMuted, onMuteChange, setMuted, sound } from './lib/sound'
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
  // True only right after a drive ends, so the results celebration plays once.
  const [celebrate, setCelebrate] = useState(false)

  // A soft click on every button.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.('.btn, .corner-btn')) sound.click()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const saved = loadDrive(today)
  const dailyDone = Boolean(saved && (saved.finished || saved.results.length >= PLAYS_PER_DRIVE))
  const dailyInProgress = Boolean(saved && !dailyDone && (saved.results.length > 0 || saved.current))

  const startDaily = useCallback(() => {
    const s = loadDrive(today)
    // Prompts come from the saved drive if one exists, so a pool update mid-day can't swap them.
    const prompts = s ? (s.promptIds.map(getPrompt).filter(Boolean) as PromptDef[]) : dailyPrompts
    const state = s ?? freshState(today, driveNo, prompts)
    setActive({ session: { mode: 'daily', label: `DRIVE #${driveNo}`, prompts }, state })
    setCelebrate(false)
    setView(state.finished || state.results.length >= PLAYS_PER_DRIVE ? 'results' : 'drive')
    if (!hasSeenHelp()) setHelp(true)
  }, [today, driveNo, dailyPrompts])

  const startPractice = useCallback((replay?: number) => {
    const prompts = replay ? promptsForDrive(replay) : randomPractice()
    const label = replay ? `DRIVE #${replay}` : 'PRACTICE'
    const date = replay ? dateForDrive(replay) : today
    setActive({ session: { mode: 'practice', label, prompts }, state: freshState(date, replay ?? 0, prompts) })
    setCelebrate(false)
    setView('drive')
    if (!hasSeenHelp()) setHelp(true)
  }, [today])

  useEffect(() => {
    const route = () => {
      const n = hashDrive()
      // Only past or current drives can be replayed, so future prompts stay secret.
      if (n && n <= driveNumber(todayKey())) startPractice(n)
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
    setCelebrate(true)
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
      <Stadium teams={view === 'home'} />
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
          <Drive key={active.session.label + active.state.date} session={active.session} initial={active.state} onComplete={onComplete} paused={help} />
        )}
        {view === 'results' && active && (
          <Results
            state={active.state}
            prompts={active.session.prompts}
            label={active.session.label}
            mode={active.session.mode}
            celebrate={celebrate}
            stats={active.session.mode === 'daily' ? stats : undefined}
            onHome={goHome}
            onPractice={() => startPractice()}
          />
        )}
      </main>
      {view !== 'home' && (
        <button className="corner-btn" onClick={goHome} aria-label="Back to home">◀ HOME</button>
      )}
      <SoundToggle />
      {help && <HowToPlay onClose={closeHelp} />}
      <Effects />
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
          <InstallButton />
        </div>
      </div>
    </div>
  )
}

function SoundToggle() {
  const [muted, setM] = useState(isMuted)
  useEffect(() => onMuteChange(setM), [])
  return (
    <button
      className={`corner-btn sound-btn ${muted ? 'off' : ''}`}
      onClick={() => setMuted(!muted)}
      aria-label={muted ? 'Turn sound on' : 'Mute sound'}
      aria-pressed={!muted}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {muted
          ? <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />}
      </svg>
      <span>{muted ? 'OFF' : 'ON'}</span>
    </button>
  )
}

// Camera flashes popping in the crowd. Positions are fixed so they don't jump between renders.
const FLASHBULBS = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return { left: `${(r(1) * 100).toFixed(1)}%`, top: `${(r(2) * 100).toFixed(1)}%`, delay: `${(r(3) * 9).toFixed(2)}s`, dur: `${(6 + r(4) * 7).toFixed(2)}s` }
})

function Stadium({ teams }: { teams: boolean }) {
  return (
    <div className="stadium" aria-hidden="true">
      <div className="sky" />
      <div className="beam left" />
      <div className="beam right" />
      <div className="lights left" />
      <div className="lights right" />
      <div className="crowd">
        {FLASHBULBS.map((f, i) => (
          <span key={i} className="flashbulb" style={{ left: f.left, top: f.top, animationDelay: f.delay, animationDuration: f.dur }} />
        ))}
      </div>
      <div className="field-perspective">
        <div className="field-plane" />
      </div>
      {teams && <Teams />}
    </div>
  )
}
