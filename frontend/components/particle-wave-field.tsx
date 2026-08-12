'use client'

import { useEffect, useRef } from 'react'

type ParticleWaveFieldProps = {
  className?: string
  opacity?: number
}

type Particle = {
  x: number
  y: number
  z: number
  size: number
  alpha: number
  phase: number
  speed: number
  tint: number
}

/** A reusable, canvas-only digital wave field. */
export function ParticleWaveField({ className = '', opacity = 0.78 }: ParticleWaveFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return

    let frame = 0
    let width = 0
    let height = 0
    let dpr = 1
    let particles: Particle[] = []
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let visible = document.visibilityState === 'visible'
    let lastDraw = 0
    let frameInterval = 1000 / 144

    const random = (min: number, max: number) => min + Math.random() * (max - min)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      // A sharper backing store keeps the dots crisp, while the cap prevents
      // retina displays from multiplying the canvas cost indefinitely.
      dpr = Math.min(window.devicePixelRatio || 1, width < 640 ? 1.5 : 1.75)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const mobile = width < 640
      const columns = Math.min(mobile ? 86 : 142, Math.max(mobile ? 58 : 82, Math.floor(width / (mobile ? 8 : 8.5))))
      const rows = mobile ? 10 : 15
      const waveCount = mobile ? 3 : 4
      // Match common device refresh rates. requestAnimationFrame still
      // naturally clamps this to the actual display refresh rate.
      frameInterval = mobile ? 1000 / 60 : 1000 / 144
      particles = []
      for (let wave = 0; wave < waveCount; wave += 1) {
        for (let row = 0; row < rows; row += 1) {
          for (let column = 0; column < columns; column += 1) {
            particles.push({
              x: column / Math.max(columns - 1, 1),
              y: row / Math.max(rows - 1, 1),
              z: wave * 0.13 + random(-0.05, 0.05),
              size: random(0.45, 1.25) * (wave < 2 ? 1.1 : 0.82),
              alpha: random(0.16, 0.62) * (wave < 2 ? 1 : 0.7),
              phase: random(0, Math.PI * 2),
              speed: random(0.7, 1.25),
              tint: random(0, 1),
            })
          }
        }
      }
    }

    const draw = (now: number) => {
      if (!visible) {
        frame = 0
        return
      }

      if (now - lastDraw < frameInterval) {
        frame = window.requestAnimationFrame(draw)
        return
      }
      lastDraw = now
      const time = reducedMotion ? now * 0.00005 : now * 0.00018
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      // Fine horizontal scan lines make the field feel digital without adding DOM nodes.
      context.fillStyle = 'rgba(82, 45, 150, 0.035)'
      for (let y = height * 0.08; y < height * 0.9; y += 7) context.fillRect(0, y, width, 1)

      for (const particle of particles) {
        const depth = 1 - particle.z
        const waveY = height * (0.54 + (particle.y - 0.5) * 0.34 * depth)
        const drift = particle.x + time * particle.speed * 0.08 + particle.z * 0.03
        const wrappedX = ((drift % 1) + 1) % 1
        const x = wrappedX * width
        const wave =
          Math.sin(wrappedX * 12.5 + time * particle.speed * 2.8 + particle.phase) * 34 +
          Math.sin(wrappedX * 25 - time * 1.7 + particle.phase * 0.4) * 10
        const vertical = waveY + wave * (0.65 + particle.y * 0.55) + Math.sin(time * 2 + particle.phase) * 3
        const perspective = 0.58 + depth * 0.62
        const radius = particle.size * perspective
        const alpha = particle.alpha * (0.55 + Math.abs(Math.sin(particle.phase + time)) * 0.65)
        const purple = particle.tint > 0.22

        context.fillStyle = purple
          ? `rgba(156, 92, 255, ${alpha})`
          : `rgba(222, 214, 255, ${alpha * 0.8})`
        // Square pixels read more clearly as a digital field and avoid the
        // expensive anti-aliased arc path for every particle.
        const point = Math.max(0.7, radius * 1.35)
        context.fillRect(Math.round(x - point / 2), Math.round(vertical - point / 2), point, point)

        if (particle.tint > 0.9 && radius > 0.8) {
          context.fillStyle = `rgba(218, 196, 255, ${alpha * 0.16})`
          context.fillRect(x - 3, vertical, 7, 0.7)
        }
      }

      // Sparse independent data streaks in the negative space around the waves.
      for (let i = 0; i < 22; i += 1) {
        const x = ((i * 71 + time * (i % 3 + 1) * 90) % (width + 120)) - 60
        const y = height * (0.08 + ((i * 37) % 84) / 100)
        const length = 5 + ((i * 17) % 42)
        context.fillStyle = i % 4 === 0 ? 'rgba(220, 210, 255, 0.5)' : 'rgba(142, 71, 255, 0.32)'
        context.fillRect(x, y, length, 0.8)
      }

      context.globalCompositeOperation = 'source-over'
      frame = window.requestAnimationFrame(draw)
    }

    const onVisibilityChange = () => {
      visible = document.visibilityState === 'visible'
      if (visible && !frame) frame = window.requestAnimationFrame(draw)
    }
    const onMotionChange = (event: MediaQueryListEvent) => { reducedMotion = event.matches }

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', onMotionChange)
    frame = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.matchMedia('(prefers-reduced-motion: reduce)').removeEventListener('change', onMotionChange)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} style={{ opacity }} />
}
