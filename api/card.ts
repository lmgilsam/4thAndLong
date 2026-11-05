// GET /api/card?c=3-2222121 → the 1200x630 PNG result card used as og:image by /r/<code>.
import { decodeShare } from '../src/engine/share'
import { renderCard } from './_lib/card'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const result = decodeShare(url.searchParams.get('c'))
  if (!result) return Response.redirect(`${url.origin}/og.jpg`, 302)
  try {
    return await renderCard(result, url.origin)
  } catch {
    return Response.redirect(`${url.origin}/og.jpg`, 302)
  }
}
