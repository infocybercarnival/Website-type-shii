import { Reveal } from './reveal'
import Image from 'next/image'

export function Intro() {
  return (
    <section id="about" className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:py-48">
      <Reveal>
        <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
          01 / INTRODUCTION
        </p>
      </Reveal>

      <Reveal delay={100}>
        <h2 className="mt-8 font-sans text-[clamp(2.75rem,8vw,7rem)] font-bold leading-[0.95] tracking-tight text-foreground text-balance">
          EVERY SYSTEM
          <br />
          HAS AN ENTRY POINT.
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-10 lg:grid-cols-12">
        <Reveal delay={150} className="lg:col-span-5 lg:col-start-1">
          <div className="group relative aspect-[954/536] w-full cursor-pointer overflow-hidden rounded-sm border border-border bg-background transition-all duration-500 hover:border-primary hover:shadow-[0_0_50px_-8px_rgba(139,92,246,0.7)]">
            <Image
              src="/assets/branding/cybercarnival-poster.png"
              alt="CyberCarnival 2026 event poster"
              fill
              className="object-cover opacity-100 transition-[transform,filter] duration-700 ease-out group-hover:scale-110 group-hover:brightness-110"
            />
            {/* diagonal light sweep, plays on hover — a single bar that
                translates across; nothing here ever toggles opacity on a
                full-size wrapper, so it can't dim the poster underneath */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[sheen-sweep_0.9s_ease-out]"
            />
          </div>
        </Reveal>

        <Reveal delay={200} className="lg:col-span-5 lg:col-start-7">
          <div className="group cursor-default border-l-2 border-transparent pl-0 transition-all duration-500 hover:border-primary hover:pl-6">
            <p className="text-lg leading-relaxed text-muted-foreground transition-colors duration-500 text-pretty group-hover:text-foreground">
              CyberCarnival is SRM Ramapuram&apos;s flagship cybersecurity
              symposium — a full day where students, researchers, and industry
              operators break systems, defend them, and rebuild them better. From
              live capture-the-flag arenas to red team exercises and hands-on
              workshops, this is where offensive curiosity meets defensive
              discipline.
            </p>
            <p className="mt-6 font-mono text-[11px] tracking-[0.25em] text-muted-foreground transition-colors duration-500 group-hover:text-primary">
              ONE DAY. SEVEN ARENAS. ZERO SANDBOXES.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
