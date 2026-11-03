import type { TierId } from '../data/types'

// Chalkboard route diagrams, one per tier. Drawn as if from a playbook:
// the O is the receiver, the dashed line is the line of scrimmage.
const ROUTES: Record<TierId, string> = {
  1: 'M60 70 L60 58 L80 58',
  2: 'M60 70 L60 62 L92 34',
  3: 'M60 70 L60 36 L96 36',
  4: 'M60 70 L60 14',
  5: 'M60 70 L60 52 L40 38 L66 24 L60 4',
}

export function RouteArt({ tier, color, miss }: { tier?: TierId; color: string; miss?: boolean }) {
  return (
    <svg className="route-art" viewBox="0 0 120 84" aria-hidden="true">
      <rect x="6" y="0" width="108" height="10" rx="2" fill={tier === 5 ? color : 'transparent'} opacity="0.25" />
      <line x1="6" y1="74" x2="114" y2="74" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45" />
      <circle cx="60" cy="78" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      {miss ? (
        <g stroke={color} strokeWidth="5" strokeLinecap="round" className="route-draw">
          <path d="M44 22 L76 54" pathLength={1} />
          <path d="M76 22 L44 54" pathLength={1} />
        </g>
      ) : (
        tier && (
          <>
            <path
              d={ROUTES[tier]}
              pathLength={1}
              className="route-draw"
              fill="none"
              stroke={color}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={`url(#arrow-${tier})`}
            />
            <defs>
              <marker id={`arrow-${tier}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill={color} />
              </marker>
            </defs>
          </>
        )
      )}
    </svg>
  )
}
