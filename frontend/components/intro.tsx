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
          <div className="relative aspect-[954/536] w-full overflow-hidden rounded-sm border border-border">
            <Image
              src="/assets/branding/cybercarnival-poster.png"
              alt="CyberCarnival 2026 event poster"
              fill
              className="object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={200} className="lg:col-span-5 lg:col-start-7">
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
            CyberCarnival is SRM Ramapuram&apos;s flagship cybersecurity
            symposium — a full day where students, researchers, and industry
            operators break systems, defend them, and rebuild them better. From
            live capture-the-flag arenas to red team exercises and hands-on
            workshops, this is where offensive curiosity meets defensive
            discipline.
          </p>
          <p className="mt-6 font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
            ONE DAY. SEVEN ARENAS. ZERO SANDBOXES.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
