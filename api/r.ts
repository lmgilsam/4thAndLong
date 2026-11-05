// GET /r/<code> (rewritten to /api/r?c=<code> in vercel.json): a shared result link.
// Serves the normal game page with the link-preview tags swapped for this result, so
// iMessage, WhatsApp, etc. show the result card, and a friend who taps it just lands in the game.
// The app then tidies the address bar back to "/" and tags the visit as ref "share" (src/lib/ref.ts).
import { decodeShare, shareLabel } from '../src/engine/share'

export const config = { runtime: 'edge' }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function setMeta(html: string, attr: 'property' | 'name', key: string, value: string): string {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`)
  return html.replace(re, `$1${esc(value)}$2`)
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const result = decodeShare(url.searchParams.get('c'))
  if (!result) return Response.redirect(`${url.origin}/`, 302)

  const page = await fetch(`${url.origin}/`)
  if (!page.ok) return Response.redirect(`${url.origin}/`, 302)
  let html = await page.text()

  const label = shareLabel(result).replace('DRIVE', 'Drive').replace('PRACTICE', 'Practice')
  const title = `${result.outcome.label} · ${result.score} pts · ${label}`
  const description = 'Can you beat it? 7 football prompts a day. Rarer answers gain more yards.'
  const shareUrl = `https://4thandlong.io/r/${result.code}`
  const image = `https://4thandlong.io/api/card?c=${result.code}`

  html = setMeta(html, 'property', 'og:title', title)
  html = setMeta(html, 'property', 'og:description', description)
  html = setMeta(html, 'property', 'og:url', shareUrl)
  html = setMeta(html, 'property', 'og:image', image)
  html = setMeta(html, 'property', 'og:image:type', 'image/png')
  html = setMeta(html, 'property', 'og:image:alt', `${title}. 4th & Long: The Daily Drive`)
  html = setMeta(html, 'name', 'twitter:title', title)
  html = setMeta(html, 'name', 'twitter:description', description)
  html = setMeta(html, 'name', 'twitter:image', image)
  // The build uses relative asset paths (base './'); from /r/<code> they must still load from the root.
  html = html.replace('<head>', '<head>\n    <base href="/" />')

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Short cache: the page points at hashed assets that change with every deploy.
      'Cache-Control': 'public, max-age=0, s-maxage=60',
    },
  })
}
