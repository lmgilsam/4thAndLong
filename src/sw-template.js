/* 4th & Long service worker. Built by the pwa() plugin in vite.config.ts, which swaps in
   __VERSION__, __PRECACHE__ and __ASSETS__ and writes the result to dist/sw.js. Not used in dev.

   - Pages (navigations): network first, so a new deploy shows up right away. If the network
     is down or takes longer than 3.5s, the cached copy of the game loads instead.
   - Built JS/CSS/fonts (/assets/*, hashed names): cache first. They never change.
   - Other same-origin files (team answer lists, sounds, icons): served from cache, refreshed
     in the background.
   - Never touched: /api/* (result pages and cards), /_vercel/* (analytics), other origins
     (Supabase), and anything that isn't a GET. */

const VERSION = '__VERSION__'
const PRECACHE = `dd-precache-${VERSION}`
const RUNTIME = 'dd-runtime'
const PRECACHE_URLS = __PRECACHE__
const BUILD_ASSETS = __ASSETS__
const NAV_TIMEOUT_MS = 3500

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dd-precache-') && k !== PRECACHE).map((k) => caches.delete(k))))
      .then(pruneOldAssets)
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/')) return
  if (req.headers.has('range')) return

  if (req.mode === 'navigate') {
    event.respondWith(navigate(req, url))
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req))
  } else {
    event.respondWith(staleWhileRevalidate(req, event))
  }
})

async function navigate(req, url) {
  const isHome = url.pathname === '/' || url.pathname === '/index.html'
  try {
    const res = await withTimeout(fetch(req), NAV_TIMEOUT_MS)
    if (isHome && res.ok) {
      const copy = res.clone()
      caches.open(PRECACHE).then((c) => c.put('/index.html', copy))
    }
    return res
  } catch {
    // Offline or very slow: open the cached game. Result links (/r/...) land here too;
    // the app sends them to the home page.
    const cached = await caches.match('/index.html')
    return cached ?? Response.error()
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req)
  if (cached) return cached
  const res = await fetch(req)
  if (res.ok) {
    const copy = res.clone()
    caches.open(RUNTIME).then((c) => c.put(req, copy))
  }
  return res
}

async function staleWhileRevalidate(req, event) {
  const cached = await caches.match(req, { ignoreSearch: true })
  const network = fetch(req)
    .then((res) => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone()
        caches.open(RUNTIME).then((c) => c.put(req, copy))
      }
      return res
    })
  if (cached) {
    event.waitUntil(network.catch(() => undefined))
    return cached
  }
  return network
}

// Hashed files from older deploys pile up in the runtime cache; drop the ones this build no longer uses.
async function pruneOldAssets() {
  const keep = new Set(BUILD_ASSETS)
  const cache = await caches.open(RUNTIME)
  const reqs = await cache.keys()
  await Promise.all(reqs.map((r) => {
    const path = new URL(r.url).pathname
    return path.startsWith('/assets/') && !keep.has(path) ? cache.delete(r) : undefined
  }))
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}
