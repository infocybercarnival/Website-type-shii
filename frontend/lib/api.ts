// Talks to Flask backend. In dev (`pnpm dev`), NEXT_PUBLIC_API_URL from
// .env.development points at the standalone backend on :5000. In production
// this is unset on purpose — Flask serves the built frontend and the API
// from the same origin, so relative paths ('') just work, no CORS needed.
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Every call that carries the participant session cookie needs
// credentials: 'include' — otherwise the browser won't send/accept it
// cross-origin (dev mode, frontend on :3000 / backend on :5000).
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, { ...options, credentials: 'include' })
}

export class ApiValidationError extends Error {
  fields?: Record<string, string>
  status?: number
  constructor(message: string, fields?: Record<string, string>, status?: number) {
    super(message)
    this.fields = fields
    this.status = status
  }
}

async function parseOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiValidationError(data.error || `request failed (${res.status})`, data.fields, res.status)
  }
  return data
}

// --- Events ---------------------------------------------------------------------------

export type ApiEvent = {
  id: string
  name: string
  category: string
  tag: string | null
  description: string | null
  poster_url: string | null
  venue: string | null
  date: string | null
  time: string | null
  fee: string | null
  min_team_size: number | null
  max_team_size: number | null
  max_teams: number | null
  teams_registered: number
  seats_available: number | null
  prize: string | null
}

export async function fetchEvents(): Promise<ApiEvent[]> {
  const res = await fetch(`${API_URL}/api/events`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Could not load events from the server.')
  return res.json()
}

// --- Auth / account -------------------------------------------------------------------

export type PublicUser = {
  id: string
  cybercarnival_token: string
  username: string
  email: string
  full_name: string | null
  phone: string | null
  college: string | null
  profile_completed: boolean
}

export async function requestOtp(email: string): Promise<void> {
  const res = await apiFetch('/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  await parseOrThrow(res)
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  const res = await apiFetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  })
  await parseOrThrow(res)
}

export async function login(username: string, password: string): Promise<{ user: PublicUser; must_change_password: boolean }> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return parseOrThrow(res)
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' })
}

export async function fetchMe(): Promise<PublicUser | null> {
  const res = await apiFetch('/api/auth/me')
  if (res.status === 401) return null
  return parseOrThrow(res)
}

export async function completeProfile(data: { full_name: string; phone: string; college?: string }): Promise<PublicUser> {
  const res = await apiFetch('/api/auth/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return parseOrThrow(res)
}

export async function changePassword(new_password: string): Promise<void> {
  const res = await apiFetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_password }),
  })
  await parseOrThrow(res)
}

export type MyEvent = {
  registration_id: string
  event_id: string
  event_name: string
  team_name: string | null
  is_leader: boolean
  members: { name: string; token: string }[]
  venue: string | null
  date: string | null
  time: string | null
}

export async function fetchMyEvents(): Promise<MyEvent[]> {
  const res = await apiFetch('/api/auth/me/events')
  return parseOrThrow(res)
}

// --- Event registration (team, by cybercarnival token) --------------------------------

export type RegistrationPayload = {
  event_id: string
  team_name?: string
  member_tokens?: string[]
}

export async function submitRegistration(payload: RegistrationPayload): Promise<{ id: string; status: string }> {
  const res = await apiFetch('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseOrThrow(res)
}
