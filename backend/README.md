# CyberCarnival Backend + Admin Panel

Flask API + secure admin dashboard for CyberCarnival, backed by MySQL
(via SQLAlchemy — see `models.py` / `schema.sql`). Serves the built
Next.js frontend (`frontend/out`) from the same process in production,
so `python app.py` alone runs the whole site.

## What's in here

- **Participant accounts** — email → OTP → CyberCarnival token +
  system-issued username/password (emailed) → profile completion →
  team registration for events using teammates' tokens
- **Public API** — `GET /api/events`, `GET /api/events/<id>`,
  `POST /api/registrations` (login required), `/api/auth/*` (OTP, login,
  profile, change-password, `/me`, `/me/events`)
- **Admin panel** — `/admin/login`, `/admin/` dashboard: Overview,
  Registrations, **Participants** (registered vs signed-up-but-never-registered),
  **Events** (full CRUD — poster upload, fee, min/max team size, `max_teams`
  capacity, venue, date/time, prize, description, edit-in-place), Audit Log
- **Storage** — MySQL (`admins`, `otp_verifications`, `users`, `events`,
  `event_registrations`, `registration_members`, `audit_log`); `db.create_all()`
  creates tables automatically on first run. `data/login_attempts.json` is the
  one thing still on the old JSON store (small, ephemeral, no need for a table).
- **Uploads** — event posters saved to `data/uploads/posters/`, served at
  `/uploads/posters/<file>`

## 1. Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
```

Edit `.env`:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"   # paste into SECRET_KEY
```

Create the database (local MySQL, matching `.env`'s `DB_*` values):

```sql
CREATE DATABASE cybercarnival CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cybercarnival'@'localhost' IDENTIFIED BY 'your-password-here';
GRANT ALL PRIVILEGES ON cybercarnival.* TO 'cybercarnival'@'localhost';
```

Set `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` in `.env`
to match. Set `ALLOWED_ORIGINS` to wherever the frontend is served from
(e.g. `http://localhost:3000` in dev, your real domain in prod).

**Email (OTP delivery)** — leave `EMAIL_DEV_MODE=true` to develop with zero
email setup: OTPs and issued credentials get written to the server log
instead of sent. To actually send email, set `EMAIL_DEV_MODE=false` and fill
in a Gmail app password:

```
EMAIL_SMTP_URL=smtp.gmail.com:587
EMAIL_SMTP_USER=your-account@gmail.com
EMAIL_SMTP_PASSWORD=<16-character app password, not your normal Gmail password>
EMAIL_FROM=your-account@gmail.com
EMAIL_FROM_NAME=CyberCarnival
```
(Generate an app password at https://myaccount.google.com/apppasswords —
requires 2-Step Verification on the account.)

## 2. Seed data

```bash
python3 seed_events.py   # loads the 11 events with fee/venue/etc (posters: upload from admin panel)

# Create your first admin account (password hashed on write, never stored in plaintext):
python3 seed_admin.py
```
Prompts for a username/password interactively if `BOOTSTRAP_ADMIN_USERNAME`/
`BOOTSTRAP_ADMIN_PASSWORD` aren't set in `.env` (min 3 characters — raise this
for a real deployment). Add more admins later the same way.

## 3. Build the frontend (once, or whenever frontend files change)

```bash
cd ../frontend
pnpm install
pnpm build      # writes frontend/out — this is what Flask serves
```

## 4. Run (development)

```bash
cd backend
python3 app.py
# or
flask --app app run
```
Visit `http://127.0.0.1:5000/` for the site, `/admin/login` for the admin panel.

## 5. Run (production)

Never use the Flask dev server in production. Run behind gunicorn, and put
gunicorn behind a reverse proxy (nginx/Caddy) that terminates TLS:

```bash
export FLASK_ENV=production   # in .env — enables Secure cookies + HSTS, fails fast without SECRET_KEY
gunicorn -w 4 -b 127.0.0.1:8000 app:app
```

nginx (sketch):

```nginx
server {
    listen 443 ssl;
    server_name your-domain.example;
    # ssl_certificate / ssl_certificate_key ...

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

Run gunicorn under systemd (or similar) so it restarts on crash/reboot.

If you run more than one gunicorn worker, set `RATELIMIT_STORAGE_URI` in
`.env` to a shared store (e.g. `redis://localhost:6379`) — the default
`memory://` limiter state is per-process and won't be shared across workers.

## Security measures (what's actually enforced, not just claimed)

| Area | Measure |
|---|---|
| Passwords | scrypt hashing (werkzeug), never stored/logged in plaintext |
| OTP | 6-digit, scrypt-hashed at rest, 10-minute expiry, capped attempts, resend cooldown |
| Sessions (admin + participant) | HttpOnly, SameSite=Lax cookies, Secure in production, 4h expiry |
| CSRF | Flask-WTF, enforced on every admin state-change; `/api/auth/*` and `/api/registrations` are exempt with reasoning documented in `app.py` (SameSite=Lax + strict CORS origin allow-list + rate limiting is the real protection there, same as the public API always relied on) |
| Brute force | Per-username+IP lockout after 5 failed admin logins (15 min), rate limiting on OTP/login/registration endpoints |
| User enumeration | Login always takes the same code path/timing whether the username exists or not |
| Input validation | Allow-list regex validation on every field (including OTP codes and CyberCarnival tokens); nothing free-text reaches storage or templates unsanitized |
| XSS | Jinja2 autoescaping in all admin templates; admin JS also escapes before injecting into the DOM |
| Injection | SQLAlchemy ORM — parameterized queries throughout, no string-concatenated SQL |
| CORS | Public API locked to explicit `ALLOWED_ORIGINS`, credentials only for those origins; admin routes are same-origin only, not exposed via CORS at all |
| Headers | CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, HSTS (prod) |
| Secrets | `.env`-only, `.gitignore`d; app refuses to boot in production without `SECRET_KEY` |
| Uploads | Poster uploads validated by extension + size (5 MB cap), renamed to a random filename, path-traversal-checked on serve |
| DoS | 6 MB request body cap (sized for poster uploads), rate limits on write-heavy endpoints |
| Audit trail | Every admin login, failed login, edit, delete, and export is logged with actor, IP, timestamp — viewable in the Audit Log tab |

### Known trade-offs, worth knowing about

- **`EMAIL_DEV_MODE`**: until real SMTP creds are set, OTPs/credentials go to
  the server log, not real inboxes — fine for development, must be turned off
  (with real Gmail app-password creds) before real participants sign up.
- **Single-process rate limiting**: `memory://` limiter storage doesn't share
  state across multiple gunicorn workers. Fine for `-w 1`; use Redis for `-w 4+`.
- **System-issued passwords**: the temp password emailed after OTP verification
  must be changed via `POST /api/auth/change-password` — there's no forced
  UI gate on this yet (the flag `must_change_password` is tracked but not
  yet enforced client-side beyond login returning it).
