import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

// Files from public/ the installed app needs offline. Team answer lists (public/teams) are
// cached when a drive loads them instead, so installing doesn't download all 96.
const PUBLIC_PRECACHE = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/apple-touch-icon.png',
  '/sounds/crowd-cheer.mp3',
]

/**
 * Writes dist/sw.js (the offline layer for the home screen app) from src/sw-template.js.
 * The precache list is this build's own files, so every deploy gets a new cache version.
 * Font files: only the Latin subsets are precached; other subsets load if a page ever needs them.
 */
function pwa(): Plugin {
  return {
    name: 'dd-pwa',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter((f) => f !== 'index.html').map((f) => `/${f}`)
      const isFont = (f: string) => /\.(woff2?|ttf|otf)$/.test(f)
      const precache = [
        '/index.html',
        ...assets.filter((f) => !isFont(f) || (/latin-/.test(f) && !/latin-ext/.test(f) && f.endsWith('.woff2'))),
        ...PUBLIC_PRECACHE,
      ]
      // Hashed names cover code changes; public files and index.html are hashed by content.
      const hash = createHash('sha256').update(precache.join('\n')).update(readFileSync('index.html'))
      PUBLIC_PRECACHE.forEach((f) => hash.update(readFileSync(`public${f}`)))
      const version = hash.digest('hex').slice(0, 12)
      const source = readFileSync('src/sw-template.js', 'utf8')
        .replace("'__VERSION__'", JSON.stringify(version))
        .replace('= __PRECACHE__', `= ${JSON.stringify(precache)}`)
        .replace('= __ASSETS__', `= ${JSON.stringify(assets)}`)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// base './' keeps asset paths relative so the build works on Vercel and in previews.
export default defineConfig({
  base: './',
  plugins: [react(), pwa()],
})
