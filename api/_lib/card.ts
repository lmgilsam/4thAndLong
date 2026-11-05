// Draws the 1200x630 result card for a shared link (see src/engine/share.ts).
// Uses @vercel/og (Satori): every element is a flex box, styles are inline.
// Background and fonts are static files in public/og/, fetched from the site itself.
import { ImageResponse } from '@vercel/og'
import { shareLabel, type SharedResult } from '../../src/engine/share'
import { TIERS } from '../../src/engine/tiers'

type El = { type: string; props: Record<string, unknown> }
const h = (type: string, style: Record<string, unknown>, ...children: (El | string)[]): El => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
})

const AMBER = '#ffb627'
const MUTED = '#8fa398'
const MISS_COLOR = '#2a302c'
const LED_GLOW = '0 0 6px rgba(255,182,39,0.75), 0 0 18px rgba(255,140,0,0.35)'
const OUTCOME_STYLE = {
  td: { color: '#ffc845', textShadow: '0 0 30px rgba(255,200,69,0.55), 0 5px 0 #6b4a00' },
  fg: { color: '#8be36b', textShadow: '0 0 26px rgba(139,227,107,0.4), 0 5px 0 #23511a' },
  punt: { color: '#c9d2cc', textShadow: '0 5px 0 #26302a' },
} as const

const FONTS = [
  { name: 'Big Shoulders', file: 'big-shoulders-display-latin-900-normal.woff', weight: 900 },
  { name: 'Barlow Condensed', file: 'barlow-condensed-latin-500-normal.woff', weight: 500 },
  { name: 'Barlow Condensed', file: 'barlow-condensed-latin-800-normal.woff', weight: 800 },
  { name: 'Doto', file: 'doto-latin-800-normal.woff', weight: 800 },
] as const

function num(value: number, label: string): El {
  return h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    h('div', { fontFamily: 'Doto', fontWeight: 800, fontSize: 84, lineHeight: 1, color: AMBER, textShadow: LED_GLOW, letterSpacing: 3 }, String(value)),
    h('div', { fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 15, letterSpacing: 3.3, color: MUTED, marginTop: 6 }, label),
  )
}

export async function renderCard(r: SharedResult, origin: string): Promise<Response> {
  const fonts = await Promise.all(FONTS.map(async (f) => {
    const res = await fetch(`${origin}/og/${f.file}`)
    if (!res.ok) throw new Error(`font ${f.file}: ${res.status}`)
    return { name: f.name, data: await res.arrayBuffer(), weight: f.weight, style: 'normal' as const }
  }))
  const o = r.outcome

  const squares = r.tiers.map((t) => h('div', {
    width: 40, height: 40, borderRadius: 7, marginLeft: 5, marginRight: 5,
    backgroundColor: t ? TIERS[t].color : MISS_COLOR, boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.22)',
  }))

  const card = h('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', backgroundColor: '#07100b' },
    { type: 'img', props: { src: `${origin}/og/card-bg.jpg`, width: 1200, height: 630, style: { position: 'absolute', left: 0, top: 0 } } },
    h('div', { display: 'flex', fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 22, letterSpacing: 7, color: AMBER, marginTop: 36 },
      `4TH & LONG · ${shareLabel(r)}`),
    h('div', { display: 'flex', fontFamily: 'Big Shoulders', fontWeight: 900, fontSize: 178, lineHeight: 0.95, marginTop: 4, ...OUTCOME_STYLE[o.kind] },
      o.label.toUpperCase()),
    h('div', { display: 'flex', fontFamily: 'Barlow Condensed', fontWeight: 500, fontSize: 27, letterSpacing: 1.6, color: '#c6cfc9', marginTop: 6 },
      o.detail),
    h('div', {
      display: 'flex', alignItems: 'center', marginTop: 20, padding: '18px 36px 14px', borderRadius: 16,
      backgroundColor: 'rgba(5,10,7,0.88)', border: '1px solid #345241', boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
    },
      num(r.score, 'POINTS'),
      h('div', { display: 'flex', width: 40 }),
      num(r.yards, 'YARDS'),
      h('div', { display: 'flex', width: 2, height: 86, backgroundColor: '#2f4a3a', marginLeft: 40, marginRight: 35 }),
      h('div', { display: 'flex' }, ...squares),
    ),
    h('div', {
      position: 'absolute', bottom: 30, display: 'flex', alignItems: 'center', padding: '12px 26px', borderRadius: 12,
      backgroundColor: AMBER, boxShadow: '0 5px 0 #8a5a00, 0 12px 30px rgba(0,0,0,0.5)',
    },
      h('div', { display: 'flex', fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 24, letterSpacing: 5.3, color: '#1a1205' }, 'CAN YOU BEAT IT? PLAY AT'),
      h('div', { display: 'flex', fontFamily: 'Doto', fontWeight: 800, fontSize: 30, letterSpacing: 3.6, color: '#1a1205', marginLeft: 18 }, '4THANDLONG.IO'),
    ),
  )

  // Same link, same picture forever, so let the CDN and chat apps cache it hard.
  return new ImageResponse(card as never, {
    width: 1200,
    height: 630,
    fonts,
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
}
