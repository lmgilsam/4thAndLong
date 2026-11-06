// Ad renderer entry for "Film Room #001: Alabama QBs" (ad-film-room.html). See AdRoot.tsx for how frames are driven.
import { createRoot } from 'react-dom/client'
import '../fonts.css'
import '../index.css'
import './ad.css'
import { AdRoot } from './AdRoot'
import { FilmRoom } from './FilmRoom'
import { DURATION, LINES, MURMUR, SFX } from './timeline-film-room'

createRoot(document.getElementById('root')!).render(
  <AdRoot scene={FilmRoom} timeline={{ name: 'film-room-001', duration: DURATION, lines: LINES, sfx: SFX, murmur: MURMUR }} />,
)
