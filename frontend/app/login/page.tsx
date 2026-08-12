'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { login, ApiValidationError } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    try {
      await login(username, password)
      router.push('/dashboard')
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
        <p className="font-mono text-[11px] tracking-[0.3em] text-primary">02 / SIGN IN</p>
        <h1 className="mt-4 font-sans text-4xl font-bold leading-none tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Use the username and password emailed to you after OTP verification.
        </p>

        {error && (
          <p className="mt-6 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Field label="Username">
            <input required maxLength={64} value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              maxLength={256}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="mt-2 bg-primary px-6 py-3 font-mono text-[11px] tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {status === 'submitting' ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>

        <p className="mt-8 text-sm text-muted-foreground">
          Don't have a token yet?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
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
