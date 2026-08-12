'use client'

import dynamic from 'next/dynamic'
import { Reveal } from './reveal'

const GatewayCanvas = dynamic(
  () => import('./three/gateway-canvas').then((m) => m.GatewayCanvas),
  { ssr: false },
)

const DETAILS = [
  { label: 'DATE', value: '14 AUG 2026' },
  { label: 'TIME', value: '09:00 — 17:00' },
  { label: 'VENUE', value: 'MAIN AUDITORIUM, SRM RAMAPURAM' },
  { label: 'TEAM SIZE', value: '2 — 4 MEMBERS' },
]

export function FeaturedEvent() {
  return (
    <section
      id="featured"
      className="relative overflow-hidden border-y border-border py-32 lg:py-48"
    >
      {/* inside the installation — looking down the right flank of the gateway */}
      <GatewayCanvas
        className="absolute -right-[25%] top-1/2 h-[130%] w-[90%] -translate-y-1/2 opacity-60 lg:-right-[8%] lg:w-[55%]"
        dolly={0}
        cameraPosition={[3.4, 0.4, 4.5]}
        target={[-2, -0.2, -9]}
        parallax={0.4}
      />
      <div
        aria-hidden="true"
        className="absolute right-0 top-1/2 h-[50vmin] w-[50vmin] -translate-y-1/2 rounded-full bg-primary/10 blur-[140px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
            03 / FEATURED EVENT
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="mt-8 font-sans text-[clamp(3.5rem,12vw,11rem)] font-bold leading-[0.85] tracking-tight text-foreground">
            CAPTURE
            <br />
            THE FLAG
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-x-10 gap-y-8 lg:grid-cols-4">
            {DETAILS.map((d) => (
              <div key={d.label}>
                <dt className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
                  {d.label}
                </dt>
                <dd className="mt-2 font-sans text-sm font-medium leading-relaxed text-foreground">
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={300}>
          <a
            href="/events"
            className="mt-16 inline-flex items-center gap-3 border border-primary bg-primary/10 px-10 py-5 font-mono text-xs tracking-[0.25em] text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
          >
            ENTER THE CHALLENGE <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      </div>
    </section>
  )
}
