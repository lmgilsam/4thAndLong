import { useEffect, useRef, useState } from 'react'
import type { ConfettiOpts } from '../lib/fx'

interface Piece {
  x: number; y: number; vx: number; vy: number
  rot: number; vr: number; w: number; h: number
  color: string; life: number; ball: boolean; wobble: number
}

/** Full-screen canvas for confetti, plus a color flash overlay. Mounted once in App. */
export function Effects() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const pieces = useRef<Piece[]>([])
  const raf = useRef(0)
  const [flash, setFlash] = useState<{ color: string; strength: number; n: number } | null>(null)

  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    const g = cv.getContext('2d')
    if (!g) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    const resize = () => {
      cv.width = window.innerWidth * dpr
      cv.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const clock = { last: performance.now() }
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - clock.last) / 1000)
      clock.last = now
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const ps = pieces.current
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]
        p.vy += 900 * dt
        p.vx *= 1 - 1.6 * dt
        p.vy *= 1 - 1.1 * dt
        p.x += (p.vx + Math.sin(p.wobble) * 30) * dt
        p.y += p.vy * dt
        p.wobble += 6 * dt
        p.rot += p.vr * dt
        p.life -= dt
        if (p.life <= 0 || p.y > window.innerHeight + 40) { ps.splice(i, 1); continue }
        g.save()
        g.globalAlpha = Math.min(1, p.life * 2)
        g.translate(p.x, p.y)
        g.rotate(p.rot)
        if (p.ball) {
          g.fillStyle = '#8a4a24'
          g.beginPath()
          g.ellipse(0, 0, 9, 5.5, 0, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = '#fff'
          g.lineWidth = 1.2
          g.beginPath()
          g.moveTo(-4, 0); g.lineTo(4, 0)
          for (const lx of [-2, 0, 2]) { g.moveTo(lx, -1.8); g.lineTo(lx, 1.8) }
          g.stroke()
        } else {
          g.fillStyle = p.color
          g.scale(1, Math.cos(p.wobble * 1.7))
          g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        }
        g.restore()
      }
      raf.current = ps.length ? requestAnimationFrame(step) : 0
    }

    const onConfetti = (e: Event) => {
      const o = (e as CustomEvent<ConfettiOpts>).detail
      const count = o.count ?? 60
      const ox = (o.x ?? 0.5) * window.innerWidth
      const oy = (o.y ?? 0.4) * window.innerHeight
      const spread = ((o.spread ?? 70) * Math.PI) / 180
      const power = o.power ?? 1
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread * 2
        const speed = (420 + Math.random() * 520) * power
        pieces.current.push({
          x: ox, y: oy,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
          w: 6 + Math.random() * 6, h: 4 + Math.random() * 6,
          color: o.colors[i % o.colors.length], life: 2.2 + Math.random() * 1.4,
          ball: Boolean(o.footballs) && i % 14 === 0, wobble: Math.random() * 6,
        })
      }
      if (!raf.current) { clock.last = performance.now(); raf.current = requestAnimationFrame(step) }
    }

    const onFlash = (e: Event) => {
      const d = (e as CustomEvent<{ color: string; strength: number }>).detail
      setFlash((prev) => ({ ...d, n: (prev?.n ?? 0) + 1 }))
    }

    window.addEventListener('fx:confetti', onConfetti)
    window.addEventListener('fx:flash', onFlash)
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('fx:confetti', onConfetti)
      window.removeEventListener('fx:flash', onFlash)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <canvas ref={canvas} className="fx-canvas" aria-hidden="true" />
      {flash && (
        <div
          key={flash.n}
          className="fx-flash"
          aria-hidden="true"
          style={{ background: `radial-gradient(circle at 50% 45%, ${flash.color}, transparent 70%)`, ['--flash' as string]: flash.strength }}
          onAnimationEnd={() => setFlash(null)}
        />
      )}
    </>
  )
}
