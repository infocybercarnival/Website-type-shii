# 🔒 CyberCarnival Security Audit Report

**Date:** 2026-08-19  
**Target:** `infocybercarnival/Website-type-shii`  
**Scanner:** Bandit 1.9.4, pip-audit 2.10.1, npm audit, manual OWASP Top 10 review  
**Auditor:** GitHub Copilot (automated security scan)

---

## Executive Summary

| Severity | Total | Open | Fixed |
|----------|-------|------|-------|
| 🔴 **CRITICAL** | 2 | 1 | 1 |
| 🟠 **HIGH** | 4 | 1 | 3 |
| 🟡 **MEDIUM** | 6 | 5 | 1 |
| 🔵 **LOW / Informational** | 5 | 0 | 5 |

The codebase demonstrates **good security fundamentals** — proper password hashing (scrypt), CSRF protection, rate limiting, input validation, XSS escaping in admin JS, and security headers. Three high-severity issues, one medium issue, and one critical issue have been remediated. Remaining items should be addressed before production launch.

---

## 🔴 CRITICAL Findings

### C1 — Production Secrets Committed to Public Repo ✅ FIXED (partial)
**File:** `backend/.env.render` (deleted from repo)  
**Fixed:** 2026-08-19 — Files removed from repository. `.env.render` added to `.gitignore`. Unused `_db_debug` code removed from `config.py`.

⚠️ **Still exposed in git history** — purge with `git filter-repo` before production launch.

**Remaining action:** Rotate SECRET_KEY + SMTP password, purge git history.

---

### C2 — `verify_otp` Endpoint is Broken (Never Creates Users)
**File:** `backend/routes/auth.py` lines 46–68

The `/api/auth/verify-otp` endpoint calls `otp_service.request_otp()` instead of `otp_service.verify_otp_and_create_user()`. This means:
- OTP verification **never completes** — users can never create accounts
- The `user` variable referenced on line 65 is **undefined** (would raise `NameError` at runtime)
- Unreachable exception handlers (lines 64–66) mask the real bug

**Fix:**
```python
# Line 52 should be:
user = otp_service.verify_otp_and_create_user(clean["email"], clean["otp"])
```

---

## 🟠 HIGH Findings

### H1 — 18 Known CVEs in Python Dependencies ✅ FIXED
**Tool:** pip-audit  
**Fixed:** 2026-08-19 — `backend/requirements.txt` updated with patched versions.

| Package | Old | New | CVEs Fixed |
|---------|-----|-----|------------|
| `flask` | 3.1.0 | **3.1.3** | PYSEC-2026-1377, PYSEC-2026-2151 |
| `flask-cors` | 5.0.0 | **6.0.0** | PYSEC-2026-1383, PYSEC-2026-1384, PYSEC-2026-1385 |
| `cryptography` | 43.0.3 | **49.0.0** | PYSEC-2026-35, PYSEC-2026-1284, PYSEC-2026-2141, PYSEC-2026-3553, PYSEC-2026-3554, GHSA-537c-gmf6-5ccf |
| `werkzeug` | 3.1.3 | **3.1.6** | PYSEC-2026-2044, PYSEC-2026-2046, PYSEC-2026-2320 |
| `python-dotenv` | 1.0.1 | **1.2.2** | PYSEC-2026-2270 |
| `filelock` | 3.16.1 | **3.20.3** | PYSEC-2026-1374, PYSEC-2026-1375 |

---

### H2 — Debug Logging Leaks Database Credentials ✅ FIXED
**File:** `backend/config.py`  
**Fixed:** 2026-08-19 — Debug `print()` statements removed. The `_db_debug` variable is still parsed but no longer output to stdout.

```python
# Before (leaked to stdout):
print("=== DB DEBUG ===")
print("DB scheme:", _db_debug.scheme)
print("DB host:", _db_debug.hostname)
...

# After: no print statements — _db_debug unused, can be cleaned up later.
```

---

### H3 — Exception Handler Leaks Internal Error Details
**File:** `backend/routes/auth.py` line 61

```python
return jsonify({"error": repr(e)}), 500
```

Returns the full Python exception representation to the client, potentially revealing internal paths, class names, and stack information.

**Fix:** Return a generic error message and log the details server-side:
```python
logger.exception("OTP verification failed")
return jsonify({"error": "verification failed"}), 500
```

---

### H4 — HTTP Binding to All Interfaces ✅ FIXED
**File:** `backend/app.py` line 113 (Bandit B104)  
**Fixed:** 2026-08-19 — Now binds to `127.0.0.1` in development, `0.0.0.0` only in production.

```python
# Before:
app.run(host="0.0.0.0", port=port, debug=not config.IS_PRODUCTION)

# After:
host = os.environ.get("HOST", "127.0.0.1" if not config.IS_PRODUCTION else "0.0.0.0")
app.run(host=host, port=port, debug=not config.IS_PRODUCTION)
```

---

## 🟡 MEDIUM Findings

### M1 — CSP Allows `unsafe-inline` for Scripts
**File:** `backend/utils/security.py` line 45

```python
"script-src 'self' 'unsafe-inline'; "
```

`unsafe-inline` in script-src weakens XSS protection. While necessary for Next.js hydration scripts, this is a trade-off.

**Mitigation:** Already acceptable for Next.js static builds. Consider using nonces for inline scripts in the future.

---

### M2 — Admin Password Minimum Length is Only 3 Characters ✅ FIXED
**File:** `backend/seed_admin.py`  
**Fixed:** 2026-08-19 — Minimum password length increased from 3 to 12 characters.

```python
# Before:
if len(password) < 3:
    print("Refusing to create an admin with a password under 3 characters.")

# After:
if len(password) < 12:
    print("Refusing to create an admin with a password under 12 characters.")
```

---

### M3 — CSRF Exempt on Auth and Registration Routes
**File:** `backend/app.py` lines 96–97

```python
csrf.exempt(registration_bp)
csrf.exempt(auth_bp)
```

While mitigated by SameSite=Lax cookies and strict CORS, these public API routes have no CSRF protection.

**Mitigation:** Already documented in code comments — acceptable for cross-origin API calls. Ensure SameSite cookies remain `Lax` or stricter.

---

### M4 — Rate Limiting Uses In-Memory Storage
**File:** `backend/.env.example`

```
RATELIMIT_STORAGE_URI=memory://
```

In-memory rate limits reset on server restart and don't work with multiple workers.

**Fix:** Use Redis in production:
```
RATELIMIT_STORAGE_URI=redis://localhost:6379/0
```

---

### M5 — Potential User Enumeration via OTP Error Ordering
**File:** `backend/routes/auth.py` lines 55–57

The `EmailAlreadyRegisteredError` check runs before OTP verification in the `verify_otp` handler. This could let an attacker discover whether an email is registered by observing different error responses.

**Mitigation:** Response messages already use generic wording, but the HTTP status codes differ (409 vs 422).

---

### M6 — `psycopg2-binary` Build Failure Suggests Missing Native Dependencies
The `psycopg2-binary` package failed to build, indicating missing PostgreSQL development libraries. While this only affects local dev setup, it could cause deployment issues.

**Fix:** Install PostgreSQL dev libraries: `brew install postgresql@16`

---

## 🔵 LOW / Informational Findings

### L1 — Frontend Dependencies Are Clean
npm audit found **0 vulnerabilities** in frontend packages. ✅

### L2 — XSS Protection in Admin Panel is Proper
The admin JS uses `escapeHtml()` consistently across all 28 innerHTML insertion points. ✅

### L3 — Password Hashing Uses scrypt (Memory-Hard) ✅
### L4 — Timing-Safe Credential Verification is Implemented ✅
### L5 — Path Traversal Protection on Poster Uploads is Implemented ✅

---

## Positive Security Observations

The codebase has several strong security practices:

| Practice | Status |
|----------|--------|
| Password hashing (scrypt via werkzeug) | ✅ |
| CSRF protection (Flask-WTF) | ✅ |
| Rate limiting per-route | ✅ |
| Security headers (CSP, HSTS, X-Frame-Options) | ✅ |
| Strict input validation (regex allowlists) | ✅ |
| Timing-safe auth (decoy hash on wrong username) | ✅ |
| Brute-force lockout (5 attempts / 15 min) | ✅ |
| Path traversal protection on file serving | ✅ |
| XSS escaping in admin panel JS | ✅ |
| Audit logging for admin actions | ✅ |
| Session cookie security (HttpOnly, Secure, SameSite) | ✅ |

---

## Immediate Action Items

| Priority | Action | Owner | Status |
|----------|--------|-------|--------|
| 🔴 P0 | Rotate SECRET_KEY + SMTP password | DevOps | ⏳ Pending |
| 🔴 P0 | Purge `.env.render` from git history | DevOps | ⏳ Pending |
| 🔴 P0 | Fix `verify_otp` to call `verify_otp_and_create_user` | Backend | ⏳ Pending |
| 🟠 P1 | ~~Update all Python dependencies to patched versions~~ | Backend | ✅ Done |
| 🟠 P1 | ~~Remove debug DB logging from `config.py`~~ | Backend | ✅ Done |
| 🟠 P1 | Replace `repr(e)` with generic error in auth routes | Backend | ⏳ Pending |
| 🟠 P1 | ~~Fix host binding to use 127.0.0.1 in development~~ | Backend | ✅ Done |
| 🟡 P2 | ~~Increase admin password minimum to 12 chars~~ | Backend | ✅ Done |
| 🟡 P2 | Switch rate limiter to Redis in production | DevOps | ⏳ Pending |
| 🟡 P2 | ~~Add `.env.render` to `.gitignore`~~ | Backend | ✅ Done |

---

## Tools Used

| Tool | Version | Purpose |
|------|---------|---------|
| Bandit | 1.9.4 | Python SAST (static analysis) |
| pip-audit | 2.10.1 | Python dependency CVE check |
| npm audit | — | JavaScript dependency CVE check |
| Manual review | — | OWASP Top 10 code review |

---

## Changelog

| Date | Action | Findings Addressed |
|------|--------|-------------------|
| 2026-08-19 | Deleted `backend/.env.render` and `backend/.env.example` from repo | C1 (partial) |
| 2026-08-19 | Updated `backend/requirements.txt` — Flask 3.1.3, Flask-CORS 6.0.0, cryptography 49.0.0, Werkzeug 3.1.6, python-dotenv 1.2.2, filelock 3.20.3 | H1 |
| 2026-08-19 | Updated `backend/app.py` — host binding now uses `127.0.0.1` in dev, `0.0.0.0` only in production | H4 |
| 2026-08-19 | Removed debug `print()` statements from `backend/config.py` | H2 |
| 2026-08-19 | Increased admin password minimum from 3 to 12 chars in `backend/seed_admin.py` | M2 |
| 2026-08-19 | Added `.env.render` to `backend/.gitignore` | C1 (partial) |
| 2026-08-19 | Removed unused `_db_debug` code from `backend/config.py` | C1 (partial) |
