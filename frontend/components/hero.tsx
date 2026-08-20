'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const GatewayCanvas = dynamic(
  () => import('./three/gateway-canvas').then((m) => m.GatewayCanvas),
  { ssr: false },
)

export function Hero() {
  const contentRef = useRef<HTMLDivElement>(null)

  // as the camera dollies through the gateway, the typography
  // transitions away — fading and lifting out of the frame
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = contentRef.current
        if (!el) return
        const p = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1)
        el.style.opacity = String(Math.max(1 - p * 1.6, 0))
        el.style.transform = `translateY(${-p * 70}px) scale(${1 - p * 0.06})`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section
      id="home"
      className="relative flex h-svh min-h-[640px] w-full items-center justify-center overflow-hidden bg-background"
    >
      {/* BACKGROUND + MIDGROUND — the architectural gateway environment.
          It occupies the edges and recedes into depth; the center stays open. */}
      <GatewayCanvas
        className="absolute inset-0 z-0"
        dolly={1}
        cameraPosition={[0, 0.2, 9.5]}
        target={[0, 0.1, -6]}
        parallax={1}
      />

      {/* subtle vignette so the edges fall away and the center reads clean */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_55%_50%_at_50%_50%,transparent_45%,rgba(10,10,15,0.55)_100%)]"
      />

      {/* FOREGROUND — the typography. Always on top, always readable. */}
      <div
        ref={contentRef}
        className="pointer-events-none relative z-20 flex h-full w-full max-w-7xl flex-col justify-between px-6 pb-12 pt-28 will-change-transform lg:px-10"
      >
        {/* top label */}
        <div className="font-mono text-[11px] leading-relaxed tracking-[0.3em] text-muted-foreground">
          <p>SRM RAMAPURAM</p>
          <p>CYBERSECURITY SYMPOSIUM</p>
          <p className="text-primary">2026</p>
        </div>

        {/* the hero title — dominant, centered in the open gateway */}
        <div className="flex flex-1 items-center justify-center">
          <h1 className="text-center font-sans font-bold leading-[0.85] tracking-tight text-foreground [text-shadow:0_0_60px_rgba(10,10,15,0.9)]">
            <span className="block text-[clamp(3.8rem,13vw,11.5rem)]">CYBER</span>
            <span className="block text-[clamp(3.8rem,13vw,11.5rem)]">CARNIVAL'26</span>
          </h1>
        </div>

        {/* bottom row */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-sans text-xl font-medium leading-tight tracking-tight text-foreground lg:text-2xl text-balance">
              WHERE CYBERSECURITY
              <br />
              MEETS INNOVATION
            </p>
            <p className="mt-4 font-mono text-[11px] tracking-[0.3em] text-muted-foreground">
              7&8 OCTOBER | SRM RAMAPURAM
            </p>
          </div>

          <div className="pointer-events-auto flex flex-wrap items-center gap-4">
            <a
              href="/events"
              className="inline-flex items-center gap-3 bg-primary px-8 py-4 font-mono text-xs tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              REGISTER NOW
            </a>
            <a
              href="#events"
              className="inline-flex items-center gap-3 border border-border px-8 py-4 font-mono text-xs tracking-[0.2em] text-foreground transition-colors hover:border-primary"
            >
              EXPLORE EVENTS
            </a>
          </div>
        </div>
      </div>

      {/* scroll hint */}
      <div
        aria-hidden="true"
        className="absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 lg:block"
      >
        <div className="h-10 w-px animate-pulse bg-gradient-to-b from-primary to-transparent" />
      </div>
    </section>
  )
}
