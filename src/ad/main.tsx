// Ad renderer entry for "The Final Play" (ad.html). See AdRoot.tsx for how frames are driven.
import { createRoot } from 'react-dom/client'
import '../fonts.css'
import '../index.css'
import './ad.css'
import { AdRoot } from './AdRoot'
import { FinalPlay } from './FinalPlay'
import { DURATION, LINES, MURMUR, SFX } from './timeline'

createRoot(document.getElementById('root')!).render(
  <AdRoot scene={FinalPlay} timeline={{ name: 'final-play', duration: DURATION, lines: LINES, sfx: SFX, murmur: MURMUR }} />,
)
