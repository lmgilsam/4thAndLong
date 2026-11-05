import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './fonts.css'
import './index.css'
import App from './App.tsx'
import { captureRef } from './lib/ref'
import { logArrival } from './lib/backend'
import { playerId } from './engine/storage'

// Read ?ref= before anything renders, then count the visit (best effort, never blocks the game).
captureRef()
void logArrival(playerId())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* Vercel Web Analytics: visitors + page views. Turn it on in Vercel > Project > Analytics. */}
    <Analytics />
  </StrictMode>,
)
