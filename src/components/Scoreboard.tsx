import type { PlayResult } from '../engine/storage'
import { ballOn, PLAYS_PER_DRIVE, TIERS } from '../engine/tiers'
import { useCountUp } from '../lib/useCountUp'

export function Scoreboard({ results, current, score, yards }: {
  results: PlayResult[]
  current: number
  score: number
  yards: number
}) {
  const shownScore = useCountUp(score, 900)
  const shownYards = useCountUp(yards, 900)
  const counting = shownScore !== score
  return (
    <header className="scoreboard">
      <div className="sb-box">
        <span className="sb-label">BALL ON</span>
        <span className="led led-sm">{ballOn(shownYards)}</span>
      </div>
      <div className="sb-center">
        <div className="bulbs">
          {Array.from({ length: PLAYS_PER_DRIVE }, (_, i) => {
            const r = results[i]
            const color = r ? (r.tier ? TIERS[r.tier].color : '#3a3f3c') : undefined
            return (
              <span
                key={i}
                className={`bulb ${i === current && !r ? 'active' : ''} ${r ? 'done' : ''}`}
                style={color ? { background: color, boxShadow: r?.tier ? `0 0 8px ${color}` : 'none' } : undefined}
              />
            )
          })}
        </div>
        <span className="sb-label">PLAY {Math.min(current + 1, PLAYS_PER_DRIVE)} OF {PLAYS_PER_DRIVE}</span>
      </div>
      <div className="sb-box right">
        <span className="sb-label">SCORE</span>
        <span className={`led ${counting ? 'counting' : ''}`}>{shownScore}</span>
      </div>
    </header>
  )
}
