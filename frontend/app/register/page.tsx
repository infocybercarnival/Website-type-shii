'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { requestOtp, verifyOtp, ApiValidationError } from '@/lib/api'

type Step = 'email' | 'otp' | 'done'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle')
  const [error, setError] = useState('')

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    try {
      await requestOtp(email)
      setStep('otp')
    } catch (err) {
      setError(err instanceof ApiValidationError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setStatus('idle')
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    try {
      await verifyOtp(email, otp)
      setStep('done')
    } catch (err) {
      setError(err instanceof ApiValidationError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-32">
        <p className="font-mono text-[11px] tracking-[0.3em] text-primary">01 / REGISTER</p>
        <h1 className="mt-4 font-sans text-4xl font-bold leading-none tracking-tight text-foreground">
          Get your token
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Every participant gets a unique CyberCarnival token — share it with teammates so
          they can add you to their team when they register for an event.
        </p>

        {error && (
          <p className="mt-6 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="mt-8 flex flex-col gap-4">
            <Field label="Email">
              <input
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-2 bg-primary px-6 py-3 font-mono text-[11px] tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {status === 'submitting' ? 'SENDING…' : 'SEND CODE'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="mt-8 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to <span className="text-foreground">{email}</span>.
            </p>
            <Field label="Verification code">
              <input
                inputMode="numeric"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="tracking-[0.5em]"
              />
            </Field>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-2 bg-primary px-6 py-3 font-mono text-[11px] tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {status === 'submitting' ? 'VERIFYING…' : 'VERIFY'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="font-mono text-[11px] tracking-[0.15em] text-muted-foreground hover:text-foreground"
            >
              ← use a different email
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="mt-8">
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">VERIFIED</p>
            <h3 className="mt-3 font-sans text-2xl font-bold text-foreground">Check your email.</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your CyberCarnival token, username, and a temporary password were just sent to{' '}
              <span className="text-foreground">{email}</span>. Sign in below to complete your
              profile and register for events.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 border border-primary/60 px-6 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
            >
              GO TO LOGIN →
            </Link>
          </div>
        )}
      </main>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      <div className="mt-1 [&>input]:w-full [&>input]:border [&>input]:border-input [&>input]:bg-transparent [&>input]:px-3 [&>input]:py-2 [&>input]:text-sm [&>input]:text-foreground [&>input]:outline-none [&>input]:focus:border-primary">
        {children}
      </div>
    </div>
  )
}
