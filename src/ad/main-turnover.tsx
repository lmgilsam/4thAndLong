// Ad renderer entry for "Turnover on Downs" (ad-turnover.html). See AdRoot.tsx for how frames are driven.
import { createRoot } from 'react-dom/client'
import '../fonts.css'
import '../index.css'
import './ad.css'
import { AdRoot } from './AdRoot'
import { TurnoverOnDowns } from './TurnoverOnDowns'
import { DURATION, LINES, MURMUR, SFX } from './timeline-turnover'

createRoot(document.getElementById('root')!).render(
  <AdRoot scene={TurnoverOnDowns} timeline={{ name: 'turnover-on-downs', duration: DURATION, lines: LINES, sfx: SFX, murmur: MURMUR }} />,
)
