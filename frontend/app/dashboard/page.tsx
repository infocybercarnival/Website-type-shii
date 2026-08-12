'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import {
  fetchMe,
  fetchMyEvents,
  completeProfile,
  logout,
  type PublicUser,
  type MyEvent,
  ApiValidationError,
} from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [events, setEvents] = useState<MyEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMe()
      .then((u) => {
        if (!u) {
          router.push('/login')
          return
        }
        setUser(u)
        if (u.profile_completed) {
          fetchMyEvents().then(setEvents).catch(() => {})
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-6 pb-32 pt-36 lg:px-10">
          <p className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground">LOADING…</p>
        </main>
      </>
    )
  }

  if (!user) return null

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-32 pt-36 lg:px-10">
        <p className="font-mono text-[11px] tracking-[0.3em] text-primary">ACCOUNT</p>
        <h1 className="mt-4 font-sans text-[clamp(2rem,5vw,3.5rem)] font-bold leading-none tracking-tight text-foreground">
          {user.profile_completed ? `Welcome, ${user.full_name}` : 'Finish your profile'}
        </h1>

        <div className="mt-8 flex flex-wrap items-center gap-4 border border-border bg-card px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your CyberCarnival token</p>
            <p className="mt-1 font-mono text-lg tracking-[0.15em] text-primary">{user.cybercarnival_token}</p>
          </div>
          <p className="text-xs text-muted-foreground">Share this with teammates so they can add you when they register for an event.</p>
          <button
            type="button"
            onClick={() => logout().then(() => router.push('/'))}
            className="ml-auto font-mono text-[11px] tracking-[0.15em] text-muted-foreground hover:text-foreground"
          >
            LOG OUT
          </button>
        </div>

        {!user.profile_completed ? (
          <ProfileForm onDone={(u) => { setUser(u); fetchMyEvents().then(setEvents).catch(() => {}) }} />
        ) : (
          <YourEvents events={events} />
        )}
      </main>
    </>
  )
}

function ProfileForm({ onDone }: { onDone: (u: PublicUser) => void }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    setFieldErrors({})
    try {
      const u = await completeProfile({ full_name: fullName, phone, college })
      onDone(u)
    } catch (err) {
      if (err instanceof ApiValidationError) {
        setError(err.message)
        setFieldErrors(err.fields || {})
      } else {
        setError('Something went wrong. Try again.')
      }
    } finally {
      setStatus('idle')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex max-w-md flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Complete your profile once — after this you can register for events and join teams.
      </p>
      {error && (
        <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}
      <Field label="Full name" error={fieldErrors.full_name}>
        <input required maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Phone" error={fieldErrors.phone}>
        <input required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="College (optional)" error={fieldErrors.college}>
        <input maxLength={200} value={college} onChange={(e) => setCollege(e.target.value)} />
      </Field>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-2 bg-primary px-6 py-3 font-mono text-[11px] tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {status === 'submitting' ? 'SAVING…' : 'SAVE & CONTINUE'}
      </button>
    </form>
  )
}

function YourEvents({ events }: { events: MyEvent[] }) {
  return (
    <div className="mt-12">
      <p className="font-mono text-[11px] tracking-[0.3em] text-primary">YOUR EVENTS</p>
      {events.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          You haven't registered for any events yet. Head to the{' '}
          <a href="/events" className="text-primary hover:underline">events page</a> to join one.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {events.map((ev) => (
            <div key={ev.registration_id} className="border border-border bg-card p-5">
              <h3 className="font-sans text-lg font-bold text-foreground">{ev.event_name}</h3>
              {ev.team_name && <p className="mt-1 text-sm text-muted-foreground">Team: {ev.team_name}</p>}
              <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground">
                {[ev.venue, ev.date, ev.time].filter(Boolean).join(' · ') || 'Details TBA'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ev.members.map((m) => (
                  <span key={m.token} className="border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground">
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      <div className="mt-1 [&>input]:w-full [&>input]:border [&>input]:border-input [&>input]:bg-transparent [&>input]:px-3 [&>input]:py-2 [&>input]:text-sm [&>input]:text-foreground [&>input]:outline-none [&>input]:focus:border-primary">
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
