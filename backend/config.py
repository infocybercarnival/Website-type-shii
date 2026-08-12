"""
Central configuration. Loaded once at startup. Fails fast (refuses to boot)
if required secrets are missing in production instead of silently falling
back to an insecure default.
"""
import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

ENV = os.environ.get("FLASK_ENV", "development")
IS_PRODUCTION = ENV == "production"

SECRET_KEY = os.environ.get("SECRET_KEY", "")
if not SECRET_KEY:
    if IS_PRODUCTION:
        raise RuntimeError(
            "SECRET_KEY is not set. Refusing to start in production without it. "
            "Set SECRET_KEY in your .env file."
        )
    # Dev-only fallback so `flask run` works locally without setup.
    # Regenerated every restart on purpose — never persisted, never used in prod.
    SECRET_KEY = secrets.token_hex(32)

DATA_DIR = BASE_DIR / "data"
LOG_DIR = BASE_DIR / "logs"
DATA_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)

# events/registrations/admins/audit_log now live in MySQL (see models.py) —
# only login_attempts stays on the old JSON store (small, ephemeral, no need
# for a table).
LOGIN_ATTEMPTS_FILE = DATA_DIR / "login_attempts.json"

ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()
]

RATELIMIT_STORAGE_URI = os.environ.get("RATELIMIT_STORAGE_URI", "memory://")

# --- Database (MySQL) ---------------------------------------------------------
# Individual pieces so the .env stays readable; assembled into the SQLAlchemy URI below.
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "3306")
DB_NAME = os.environ.get("DB_NAME", "cybercarnival")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")

SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)
SQLALCHEMY_TRACK_MODIFICATIONS = False

# --- Email (OTP delivery) -----------------------------------------------------
# EMAIL_DEV_MODE=true logs the email instead of sending it — lets the OTP flow
# be exercised locally with no real SMTP credentials configured.
EMAIL_DEV_MODE = os.environ.get("EMAIL_DEV_MODE", "true").strip().lower() == "true"
EMAIL_SMTP_URL = os.environ.get("EMAIL_SMTP_URL", "smtp.gmail.com:587")
EMAIL_SMTP_USER = os.environ.get("EMAIL_SMTP_USER", "")
EMAIL_SMTP_PASSWORD = os.environ.get("EMAIL_SMTP_PASSWORD", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "") or EMAIL_SMTP_USER
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "CyberCarnival")

# OTP settings
OTP_LENGTH = 6
OTP_TTL_SECONDS = 10 * 60  # 10 minutes
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60

# Poster uploads
UPLOAD_DIR = DATA_DIR / "uploads" / "posters"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_POSTER_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_POSTER_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

# Where the built frontend (`npm run build` / `pnpm build` -> static export)
# lives. Defaults to the sibling frontend/out folder in the combined project
# layout (cybercarnival/backend + cybercarnival/frontend). Override with
# FRONTEND_DIST_DIR in .env if you keep a different layout.
FRONTEND_DIST_DIR = Path(
    os.environ.get("FRONTEND_DIST_DIR", str(BASE_DIR.parent / "frontend" / "out"))
).resolve()

# Hard ceiling on request body size (bytes). Raised from the original 64 KB
# (sized for the old anonymous JSON registration form) to fit admin poster
# uploads (up to MAX_POSTER_SIZE_BYTES) on the same Flask app.
MAX_CONTENT_LENGTH = 6 * 1024 * 1024  # 6 MB

SESSION_COOKIE_SECURE = IS_PRODUCTION
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
PERMANENT_SESSION_LIFETIME_SECONDS = 60 * 60 * 4  # 4 hours

# Login brute-force protection
MAX_FAILED_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 15 * 60
