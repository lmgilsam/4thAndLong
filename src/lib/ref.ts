// Where did this player come from? Links like https://4thandlong.io/?ref=reddit-texans
// tag a visit. The first tag a player ever arrives with is kept (first touch), sent once
// to Supabase as an "arrival", and attached to every drive they finish, so we can see
// which channels bring players who actually play. utm_source works too.
// Players who arrive from a shared result link (/r/<code>) count as "share".
// Players with no tag show up as "direct" (typed it or bookmarks).

const KEY_REF = 'dd:ref'
const KEY_REF_SENT = 'dd:ref-sent'
const PARAMS = ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

/** Lowercase, keep a-z 0-9 - _, max 32 chars. Must match clean_ref() in supabase/schema.sql. */
export function cleanRef(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32)
  return s || null
}

function get(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function set(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable: tracking is best effort */
  }
}

/**
 * Run once on page load, before the app renders. Saves the first ref this browser
 * arrived with, then removes the tracking params from the address bar so a player
 * who copies the URL doesn't pass someone else's tag along.
 */
export function captureRef(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  const fromShare = url.pathname.startsWith('/r/')
  const ref = cleanRef(url.searchParams.get('ref') ?? url.searchParams.get('utm_source') ?? (fromShare ? 'share' : null))
  if (ref && !get(KEY_REF)) set(KEY_REF, ref)
  if (fromShare || PARAMS.some((p) => url.searchParams.has(p))) {
    PARAMS.forEach((p) => url.searchParams.delete(p))
    // A shared result link (/r/3-2222121) is just a way in: show the plain home page URL.
    const path = fromShare ? '/' : url.pathname
    window.history.replaceState(window.history.state, '', path + url.search + url.hash)
  }
}

export const firstRef = (): string | null => get(KEY_REF)
export const arrivalSent = () => get(KEY_REF_SENT) === '1'
export const markArrivalSent = () => set(KEY_REF_SENT, '1')
