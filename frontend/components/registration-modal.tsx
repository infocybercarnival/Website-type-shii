'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { fetchMe, submitRegistration, ApiValidationError, type PublicUser } from '@/lib/api'

type Props = {
  eventId: string | null
  eventName: string
  onClose: () => void
}

export function RegistrationModal({ eventId, eventName, onClose }: Props) {
  const [me, setMe] = useState<PublicUser | null | 'loading'>('loading')
  const [teamName, setTeamName] = useState('')
  const [memberTokens, setMemberTokens] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchMe().then(setMe).catch(() => setMe(null))
  }, [])

  if (!eventId) return null

  function addMember() {
    if (memberTokens.length < 10) setMemberTokens([...memberTokens, ''])
  }
  function updateMember(i: number, value: string) {
    const next = [...memberTokens]
    next[i] = value.toUpperCase()
    setMemberTokens(next)
  }
  function removeMember(i: number) {
    setMemberTokens(memberTokens.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')
    setFieldErrors({})
    try {
      await submitRegistration({
        event_id: eventId!,
        team_name: teamName || undefined,
        member_tokens: memberTokens.filter((t) => t.trim().length > 0),
      })
      setStatus('done')
    } catch (err) {
      setStatus('error')
      if (err instanceof ApiValidationError) {
        setErrorMsg(err.message)
        setFieldErrors(err.fields || {})
      } else {
        setErrorMsg('Something went wrong. Try again.')
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md border border-border bg-card p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 font-mono text-sm text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>

        {me === 'loading' && (
          <p className="py-8 text-center font-mono text-[11px] tracking-[0.2em] text-muted-foreground">LOADING…</p>
        )}

        {me === null && (
          <div className="py-8 text-center">
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">SIGN IN REQUIRED</p>
            <h3 className="mt-4 font-sans text-2xl font-bold text-foreground">Get your token first</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              You need a CyberCarnival account to register for {eventName}.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                href="/register"
                className="border border-primary/60 px-5 py-2 font-mono text-[11px] tracking-[0.2em] text-foreground hover:bg-primary hover:text-primary-foreground"
              >
                REGISTER
              </Link>
              <Link
                href="/login"
                className="border border-border px-5 py-2 font-mono text-[11px] tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                SIGN IN
              </Link>
            </div>
          </div>
        )}

        {me && me !== 'loading' && !me.profile_completed && (
          <div className="py-8 text-center">
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">ALMOST THERE</p>
            <h3 className="mt-4 font-sans text-2xl font-bold text-foreground">Finish your profile</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Complete your profile before registering for {eventName}.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex border border-primary/60 px-5 py-2 font-mono text-[11px] tracking-[0.2em] text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              GO TO DASHBOARD
            </Link>
          </div>
        )}

        {me && me !== 'loading' && me.profile_completed && status === 'done' && (
          <div className="py-8 text-center">
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">REGISTERED</p>
            <h3 className="mt-4 font-sans text-2xl font-bold text-foreground">You're in.</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Registration for {eventName} confirmed. See it under "Your Events" on your dashboard.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 border border-primary/60 px-6 py-2 font-mono text-[11px] tracking-[0.2em] text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              CLOSE
            </button>
          </div>
        )}

        {me && me !== 'loading' && me.profile_completed && status !== 'done' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">REGISTER</p>
            <h3 className="font-sans text-2xl font-bold leading-tight text-foreground">{eventName}</h3>
            <p className="text-sm text-muted-foreground">
              You're registering as <span className="text-foreground">{me.full_name}</span>. Add teammates
              by their CyberCarnival token — they need an account first.
            </p>

            {errorMsg && (
              <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMsg}
              </p>
            )}

            <Field label="Team name (optional)" error={fieldErrors.team_name}>
              <input value={teamName} onChange={(e) => setTeamName(e.target.value)} maxLength={120} />
            </Field>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Teammates' tokens (optional)
                </label>
                {memberTokens.length < 10 && (
                  <button
                    type="button"
                    onClick={addMember}
                    className="font-mono text-[10px] tracking-[0.15em] text-primary hover:underline"
                  >
                    + ADD
                  </button>
                )}
              </div>
              {memberTokens.map((t, i) => (
                <div key={i} className="mt-2 flex gap-2">
                  <input
                    value={t}
                    onChange={(e) => updateMember(i, e.target.value)}
                    maxLength={16}
                    placeholder="CCXXXXXXXXXXXXX"
                    className="w-full border border-input bg-transparent px-3 py-2 font-mono text-sm tracking-[0.1em] text-foreground outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(i)}
                    className="font-mono text-xs text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {fieldErrors.member_tokens && <p className="mt-1 text-xs text-destructive">{fieldErrors.member_tokens}</p>}
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-2 bg-primary px-6 py-3 font-mono text-[11px] tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {status === 'submitting' ? 'SUBMITTING…' : 'CONFIRM REGISTRATION'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <div className="mt-1 [&>input]:w-full [&>input]:border [&>input]:border-input [&>input]:bg-transparent [&>input]:px-3 [&>input]:py-2 [&>input]:text-sm [&>input]:text-foreground [&>input]:outline-none [&>input]:focus:border-primary">
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
