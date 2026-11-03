import { START_YARD_LINE } from '../engine/tiers'

// Top-down strip of the opponent's half: midfield on the left, end zone on the right.
const MARKS = [50, 40, 30, 20, 10]
const PAD = 2 // yards of our own territory shown left of midfield, so the ball is never clipped
const SPAN = 50 + 10 + PAD // field + end zone + padding

const pct = (yardsToGoal: number) => ((50 + PAD - yardsToGoal) / SPAN) * 100
const STRIPE = (5 / SPAN) * 100
const OFFSET = (PAD / SPAN) * 100
const TURF = `repeating-linear-gradient(90deg, var(--turf-a) ${OFFSET}% ${OFFSET + STRIPE}%, var(--turf-b) ${OFFSET + STRIPE}% ${OFFSET + 2 * STRIPE}%)`

export function FieldStrip({ yards, compact = false, gain }: {
  yards: number
  compact?: boolean
  /** The play that just happened, for the "+8" pop and the turf flash. */
  gain?: { yards: number; color: string; key: number }
}) {
  const toGoal = Math.max(0, START_YARD_LINE - yards)
  const ballPct = pct(toGoal)
  const moving = Boolean(gain && gain.yards > 0)
  return (
    <div
      className={`field-strip ${compact ? 'compact' : ''} ${toGoal === 0 ? 'in-endzone' : ''}`}
      aria-label={`Ball on the ${toGoal === 0 ? 'goal line' : toGoal}`}
      style={gain ? { ['--gain' as string]: gain.color } : undefined}
    >
      <div className="turf" style={{ background: TURF }}>
        {MARKS.map((m) => (
          <div key={m} className="yard-line" style={{ left: `${pct(m)}%` }}>
            <span>{m}</span>
          </div>
        ))}
        <div className="fg-line" style={{ left: `${pct(35)}%` }}>
          <span>FG RANGE</span>
        </div>
        <div className="endzone" style={{ left: `${pct(0)}%` }}>
          <span>END ZONE</span>
        </div>
        {gain && gain.yards > 0 && <div key={`flash-${gain.key}`} className="turf-flash" />}
        <div className={`ball-marker ${moving ? 'moving' : ''}`} style={{ left: `${ballPct}%` }}>
          <svg viewBox="0 0 28 16" aria-hidden="true" key={moving ? `spin-${gain?.key}` : 'still'}>
            <ellipse cx="14" cy="8" rx="13" ry="7.2" fill="#8a4a24" stroke="#3b1d0c" strokeWidth="1.2" />
            <path d="M7 8 H21" stroke="#fff" strokeWidth="1.3" />
            <path d="M10 6 V10 M12.6 6 V10 M15.3 6 V10 M18 6 V10" stroke="#fff" strokeWidth="1.1" />
          </svg>
        </div>
        <div className="scrimmage" style={{ left: `${ballPct}%` }} />
        {gain && gain.yards > 0 && (
          <span key={`pop-${gain.key}`} className="gain-pop" style={{ left: `${ballPct}%`, color: gain.color }}>+{gain.yards}</span>
        )}
      </div>
    </div>
  )
}
