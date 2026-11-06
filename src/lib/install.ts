// Home screen app support: registers the service worker and works out how this browser
// can install the game, so the GET THE APP button can do the right thing.
//
// - Chrome / Edge / Samsung Internet (Android and desktop) fire `beforeinstallprompt`;
//   we keep it and show the browser's own install dialog when the button is tapped.
// - iPhone / iPad Safari has no install API: the button opens instructions (Share, Add to Home Screen).
// - In-app browsers (Instagram, TikTok, Facebook, Snapchat) can't install at all: tell them to open Safari.
// - Already installed (running standalone): no button.

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallMode = 'prompt' | 'ios' | 'ios-inapp' | 'android' | null

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function platform(): InstallMode {
  if (installed || isStandalone()) return null
  if (deferred) return 'prompt'
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  const inApp = /FBAN|FBAV|Instagram|musical_ly|BytedanceWebview|TikTok|Snapchat|Line\//i.test(ua)
  if (ios) return inApp ? 'ios-inapp' : 'ios'
  if (/Android/.test(ua)) return 'android'
  return null
}

/** Run once before the app renders, so an early `beforeinstallprompt` isn't missed. */
export function setupInstall(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // hold the browser's mini-infobar; our button shows the dialog instead
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    notify()
  })
  // Offline support only in real builds, so `npm run dev` never serves stale files.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        /* no offline support in this browser; the game still works */
      })
    })
  }
}

/** Shows the browser's install dialog. Returns true if the player accepted. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred
  if (!e) return false
  deferred = null
  await e.prompt()
  const { outcome } = await e.userChoice
  if (outcome === 'accepted') installed = true
  notify()
  return outcome === 'accepted'
}

export function useInstallMode(): InstallMode {
  const [mode, setMode] = useState<InstallMode>(platform)
  useEffect(() => {
    const update = () => setMode(platform())
    listeners.add(update)
    update()
    return () => { listeners.delete(update) }
  }, [])
  return mode
}
