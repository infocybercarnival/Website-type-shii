import time
from flask import request
from werkzeug.security import generate_password_hash, check_password_hash

import config
from storage import json_store


def hash_password(plain: str) -> str:
    # scrypt (werkzeug default) — memory-hard, resistant to GPU cracking.
    return generate_password_hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return check_password_hash(hashed, plain)


def add_security_headers(response):
    """Applied to every response. Defense-in-depth against XSS/clickjacking/MIME-sniffing."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

    if request.path.startswith("/admin"):
        # Admin panel: strict, no inline scripts/styles needed (own hand-written JS/CSS files).
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self'; "
            "img-src 'self' data:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
    else:
        # Public site: Next.js embeds inline hydration/bootstrap scripts and
        # Tailwind can inject inline styles, so 'unsafe-inline' is required
        # here. Still locked to same-origin otherwise, and framing/plugins
        # stay blocked.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'"
        )
    if config.IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# --- Login brute-force protection -------------------------------------------------
# Keyed by "username:ip" so an attacker can't lock out a legitimate admin by
# spraying failed logins from elsewhere, and can't bypass the limit by
# rotating IPs against a single known username without also needing the IP limit.

def _key(username: str, ip: str) -> str:
    return f"{username}:{ip}"


def is_locked_out(username: str, ip: str) -> bool:
    attempts = json_store.read_all(config.LOGIN_ATTEMPTS_FILE)
    key = _key(username, ip)
    for entry in attempts:
        if entry["key"] == key:
            if entry["count"] >= config.MAX_FAILED_LOGIN_ATTEMPTS:
                if time.time() - entry["last_attempt"] < config.LOGIN_LOCKOUT_SECONDS:
                    return True
    return False


def record_failed_login(username: str, ip: str) -> None:
    key = _key(username, ip)
    now = time.time()

    def match(r):
        return r["key"] == key

    def update(r):
        # Reset the counter if the previous lockout window has already expired.
        if now - r["last_attempt"] > config.LOGIN_LOCKOUT_SECONDS:
            r["count"] = 1
        else:
            r["count"] += 1
        r["last_attempt"] = now
        return r

    updated = json_store.update_where(config.LOGIN_ATTEMPTS_FILE, match, update)
    if not updated:
        json_store.append(config.LOGIN_ATTEMPTS_FILE, {"key": key, "count": 1, "last_attempt": now})


def clear_failed_logins(username: str, ip: str) -> None:
    key = _key(username, ip)
    json_store.delete_where(config.LOGIN_ATTEMPTS_FILE, lambda r: r["key"] == key)
