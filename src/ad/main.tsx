// Ad renderer entry (ad.html). See AdRoot.tsx for how frames are driven.
import { createRoot } from 'react-dom/client'
import '../fonts.css'
import '../index.css'
import './ad.css'
import { AdRoot } from './AdRoot'

createRoot(document.getElementById('root')!).render(<AdRoot />)
