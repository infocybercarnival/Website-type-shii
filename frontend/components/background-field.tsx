'use client'

import { useEffect, useRef } from 'react'

/**
 * Global animated texture — soft drifting nebula-cloud blobs + a dense
 * twinkling starfield, plus a periodic "bug" asteroid that falls down
 * the screen every so often (cybersecurity easter egg: software bug as
 * a shooting star). Fixed behind all page content, mounted once in
 * app/layout.tsx. Hero and FinalCta opt out via their own opaque
 * bg-background, which occludes this layer underneath.
 */

type Nebula = {
  x: number
  y: number
  r: number
  hue: 'violet' | 'indigo' | 'magenta'
  alpha: number
  driftX: number
  driftY: number
}

type Star = {
  x: number
  y: number
  size: number
  baseAlpha: number
  twinkleSpeed: number
  twinklePhase: number
}

type Bug = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  spin: number
  size: number
  trail: { x: number; y: number }[]
}

const NEBULA_COUNT = 5
const STAR_COUNT_PER_MPX = 140 // stars per megapixel of viewport
const MAX_DPR = 1.5
const BUG_MIN_GAP_MS = 800
const BUG_MAX_GAP_MS = 2000

const NEBULA_COLORS: Record<Nebula['hue'], [number, number, number]> = {
  violet: [140, 90, 220],
  indigo: [90, 70, 200],
  magenta: [170, 80, 200],
}

export function BackgroundField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    let width = 0
    let height = 0
    let dpr = 1
    let nebulas: Nebula[] = []
    let stars: Star[] = []
    let bugs: Bug[] = []
    let nextBugAt = 0

    function buildScene() {
      nebulas = Array.from({ length: NEBULA_COUNT }, (_, i) => {
        const hues: Nebula['hue'][] = ['violet', 'indigo', 'magenta']
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.min(width, height) * (0.35 + Math.random() * 0.35),
          hue: hues[i % hues.length],
          alpha: 0.05 + Math.random() * 0.05,
          driftX: (Math.random() - 0.5) * 0.015,
          driftY: (Math.random() - 0.5) * 0.015,
        }
      })

      const starCount = Math.round(
        ((width * height) / 1_000_000) * STAR_COUNT_PER_MPX,
      )
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() < 0.08 ? 1.6 + Math.random() * 1 : 0.6 + Math.random() * 0.8,
        baseAlpha: 0.3 + Math.random() * 0.6,
        twinkleSpeed: 0.4 + Math.random() * 1.2,
        twinklePhase: Math.random() * Math.PI * 2,
      }))
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildScene()
    }

    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    let running = true
    let last = performance.now()
    let elapsed = 0

    function onVisibility() {
      running = document.visibilityState === 'visible'
      if (running) {
        last = performance.now()
        raf = requestAnimationFrame(draw)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    function scheduleBug() {
      nextBugAt =
        elapsed + BUG_MIN_GAP_MS + Math.random() * (BUG_MAX_GAP_MS - BUG_MIN_GAP_MS)
    }
    scheduleBug()

    function spawnBug() {
      const dir = Math.random() < 0.5 ? -1 : 1
      const startX = dir === 1 ? width * (-0.05 + Math.random() * 0.15) : width * (0.9 + Math.random() * 0.15)
      const vx = dir * (60 + Math.random() * 50) // strong horizontal drift = diagonal fall
      const vy = 220 + Math.random() * 140
      bugs.push({
        x: startX,
        y: -20,
        vx,
        vy,
        rot: Math.atan2(vx, -vy), // orient the bug's "head" toward its travel direction
        spin: (Math.random() - 0.5) * 0.6,
        size: 9 + Math.random() * 5,
        trail: [],
      })
    }

    function drawNebulas() {
      ctx!.save()
      ctx!.globalCompositeOperation = 'lighter'
      nebulas.forEach((n) => {
        if (!reduceMotion) {
          n.x += n.driftX
          n.y += n.driftY
          if (n.x < -n.r) n.x = width + n.r
          if (n.x > width + n.r) n.x = -n.r
          if (n.y < -n.r) n.y = height + n.r
          if (n.y > height + n.r) n.y = -n.r
        }
        const [r, g, b] = NEBULA_COLORS[n.hue]
        const grad = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        grad.addColorStop(0, `rgba(${r},${g},${b},${n.alpha})`)
        grad.addColorStop(0.6, `rgba(${r},${g},${b},${n.alpha * 0.35})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx!.fill()
      })
      ctx!.restore()
    }

    function drawStars(tSec: number) {
      stars.forEach((s) => {
        const twinkle = reduceMotion
          ? s.baseAlpha
          : s.baseAlpha *
            (0.55 + 0.45 * Math.sin(tSec * s.twinkleSpeed + s.twinklePhase))
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(225,215,255,${twinkle})`
        ctx!.fill()
      })
    }

    function drawBug(bug: Bug) {
      ctx!.save()
      ctx!.globalCompositeOperation = 'lighter'

      // falling trail — a few fading ghost dots behind it
      bug.trail.forEach((p, i) => {
        const a = ((i + 1) / bug.trail.length) * 0.18
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, bug.size * 0.25, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(190,150,255,${a})`
        ctx!.fill()
      })

      ctx!.translate(bug.x, bug.y)
      ctx!.rotate(bug.rot)
      ctx!.shadowColor = 'rgba(196,150,255,0.8)'
      ctx!.shadowBlur = 8

      const s = bug.size
      ctx!.strokeStyle = 'rgba(220,195,255,0.85)'
      ctx!.fillStyle = 'rgba(180,130,255,0.9)'
      ctx!.lineWidth = 1.2

      // abdomen
      ctx!.beginPath()
      ctx!.ellipse(0, s * 0.15, s * 0.42, s * 0.55, 0, 0, Math.PI * 2)
      ctx!.fill()

      // head/cephalothorax
      ctx!.beginPath()
      ctx!.arc(0, -s * 0.5, s * 0.3, 0, Math.PI * 2)
      ctx!.fill()

      // 4 pairs of spider legs, angled outward front-to-back
      for (let i = 0; i < 4; i++) {
        const rowY = -s * 0.25 + i * s * 0.28
        const spread = 0.55 + i * 0.12
        ctx!.beginPath()
        ctx!.moveTo(-s * 0.3, rowY)
        ctx!.lineTo(-s * spread * 1.6, rowY - s * 0.15)
        ctx!.lineTo(-s * spread * 2.1, rowY + s * 0.25)
        ctx!.moveTo(s * 0.3, rowY)
        ctx!.lineTo(s * spread * 1.6, rowY - s * 0.15)
        ctx!.lineTo(s * spread * 2.1, rowY + s * 0.25)
        ctx!.stroke()
      }

      ctx!.restore()
    }

    function draw(now: number) {
      if (!running) return
      const dt = Math.min(now - last, 50) // ms, clamp to avoid huge jumps on tab-switch
      last = now
      elapsed += dt
      const tSec = elapsed / 1000

      ctx!.clearRect(0, 0, width, height)
      drawNebulas()
      drawStars(tSec)

      if (!reduceMotion) {
        if (elapsed >= nextBugAt) {
          spawnBug()
          scheduleBug()
        }

        bugs = bugs.filter((bug) => bug.y < height + 40)
        bugs.forEach((bug) => {
          bug.trail.push({ x: bug.x, y: bug.y })
          if (bug.trail.length > 6) bug.trail.shift()
          bug.x += (bug.vx * dt) / 1000
          bug.y += (bug.vy * dt) / 1000
          bug.rot += (bug.spin * dt) / 1000
        })
      }
      bugs.forEach(drawBug)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}
