'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { RegistrationModal } from '@/components/registration-modal'
import { EVENTS, EVENT_DATES, type EventInfo } from '@/lib/events-data'
import { fetchEvents, type ApiEvent } from '@/lib/api'

type Category = 'TECHNICAL' | 'NON-TECHNICAL'

function categoryOf(event: EventInfo): Category {
  return event.tag === 'NON-TECHNICAL' ? 'NON-TECHNICAL' : 'TECHNICAL'
}

export default function EventsPage() {
  const [category, setCategory] = useState<Category>('TECHNICAL')
  const [backendEvents, setBackendEvents] = useState<ApiEvent[]>([])
  const [backendError, setBackendError] = useState(false)
  const [selected, setSelected] = useState<EventInfo | null>(null)

  useEffect(() => {
    fetchEvents()
      .then(setBackendEvents)
      .catch(() => setBackendError(true))
  }, [])

  const idByName = new Map<string, string>(backendEvents.map((e): [string, string] => [e.name, e.id]))
  const visible = EVENTS.filter((e) => categoryOf(e) === category)

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-32 pt-36 lg:px-10">
        <p className="font-mono text-[11px] tracking-[0.3em] text-primary">EVENTS / {EVENT_DATES}</p>
        <h1 className="mt-6 font-sans text-[clamp(2.5rem,6vw,5rem)] font-bold leading-none tracking-tight text-foreground">
          ALL EVENTS
        </h1>

        {backendError && (
          <p className="mt-6 border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
            Registration is temporarily unavailable — the backend isn't reachable right now.
          </p>
        )}

        <div className="mt-10 flex gap-3">
          {(['TECHNICAL', 'NON-TECHNICAL'] as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`border px-6 py-3 font-mono text-[11px] tracking-[0.2em] transition-colors ${
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) => (
            <div key={event.no} className="group flex flex-col border border-border bg-card">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                {event.poster ? (
                  <Image
                    src={event.poster}
                    alt={event.posterAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
                    POSTER TBA
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="font-mono text-[10px] tracking-[0.25em] text-primary">{event.tag}</p>
                <h3 className="font-sans text-lg font-bold leading-tight text-foreground">{event.name}</h3>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{event.desc}</p>

                <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] tracking-[0.1em] text-muted-foreground">
                  <div><dt className="inline text-foreground/60">FEE </dt><dd className="inline">{event.details.fee}</dd></div>
                  <div><dt className="inline text-foreground/60">TEAM </dt><dd className="inline">{event.details.teamSize}</dd></div>
                  <div><dt className="inline text-foreground/60">VENUE </dt><dd className="inline">{event.details.venue}</dd></div>
                  <div><dt className="inline text-foreground/60">DATE </dt><dd className="inline">{event.details.date}</dd></div>
                </dl>

                <button
                  type="button"
                  disabled={backendError || !idByName.get(event.name)}
                  onClick={() => setSelected(event)}
                  className="mt-4 border border-primary/60 px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-foreground transition-all hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  REGISTER
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {selected && (
        <RegistrationModal
          eventId={idByName.get(selected.name) || null}
          eventName={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
