import { useEffect } from 'react'
import { DOWNS_PER_PLAY, PLAY_CLOCK_SECONDS, PLAYS_PER_DRIVE, TIERS } from '../engine/tiers'

export function HowToPlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="htp-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="htp-title">HOW TO PLAY</h2>
        <ol className="htp-steps">
          <li><strong>{PLAYS_PER_DRIVE} plays a day.</strong> Same prompts for everyone, new drive at midnight Central.</li>
          <li><strong>{PLAY_CLOCK_SECONDS}-second play clock.</strong> Type any answer that fits the prompt.</li>
          <li><strong>{DOWNS_PER_PLAY} downs per play.</strong> Wrong answers burn a down. Run out and it's a turnover.</li>
          <li><strong>Rarer answers gain more yards.</strong> The obvious answer barely moves the ball.</li>
          <li><strong>You start at midfield.</strong> Reach the end zone for a touchdown, or get into field goal range.</li>
        </ol>
        <table className="tier-table">
          <tbody>
            {Object.values(TIERS).map((t) => (
              <tr key={t.id}>
                <td><span className="tier-dot" style={{ background: t.color }} />{t.name}</td>
                <td>{t.points} pts</td>
                <td>+{t.yards} yds</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-primary" onClick={onClose} autoFocus>GOT IT</button>
      </div>
    </div>
  )
}
