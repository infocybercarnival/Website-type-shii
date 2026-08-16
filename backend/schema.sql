-- CyberCarnival — Postgres schema (Supabase). Mirrors models.py field-for-field.
-- Reference/manual-recreate only — db.create_all() in app.py creates these
-- tables automatically on boot via SQLAlchemy, so running this by hand is
-- optional. updated_at "on update" behavior is handled by SQLAlchemy
-- (onupdate=db.func.now() in models.py), not a DB trigger, since all writes
-- go through the ORM.

-- ---------------------------------------------------------------------------
-- ADMINS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id                CHAR(36)      PRIMARY KEY,
  username          VARCHAR(64)   NOT NULL UNIQUE,
  password_hash     VARCHAR(255)  NOT NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed admin — same account/hash as before (admin / admin@123).
INSERT INTO admins (id, username, password_hash) VALUES (
  'a6ea1140-5dfb-4a54-a370-2bfdab936e01',
  'admin',
  'scrypt:32768:8:1$nBwzpMhf5Gxs0wiM$ca285082ee0b1509d0a37a05f7504c71761d8f71b900689c36c6005db2231d17a58f90947139c1c6bf15bf360d2e566a13c293b486cae690e25730f5748629cb'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- OTP flow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verifications (
  id                CHAR(36)      PRIMARY KEY,
  email             VARCHAR(255)  NOT NULL,
  otp_hash          VARCHAR(255)  NOT NULL,
  purpose           VARCHAR(32)   NOT NULL DEFAULT 'signup',
  attempts          SMALLINT      NOT NULL DEFAULT 0,
  max_attempts      SMALLINT      NOT NULL DEFAULT 5,
  consumed_at       TIMESTAMP     NULL,
  expires_at        TIMESTAMP     NOT NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications (email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications (expires_at);

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                    CHAR(36)      PRIMARY KEY,
  cybercarnival_token   CHAR(16)      NOT NULL UNIQUE,
  username              VARCHAR(32)   NOT NULL UNIQUE,
  password_hash         VARCHAR(255)  NOT NULL,
  must_change_password  BOOLEAN       NOT NULL DEFAULT TRUE,
  email                 VARCHAR(255)  NOT NULL UNIQUE,
  full_name             VARCHAR(120)  NULL,
  phone                 VARCHAR(20)   NULL,
  college               VARCHAR(150)  NULL,
  profile_completed     BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_token ON users (cybercarnival_token);

-- ---------------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                CHAR(36)      PRIMARY KEY,
  name              VARCHAR(150)  NOT NULL,
  category          VARCHAR(30)   NOT NULL DEFAULT 'TECHNICAL',
  tag               VARCHAR(40)   NULL,
  description       TEXT          NULL,
  poster_url        VARCHAR(500)  NULL,
  venue             VARCHAR(200)  NULL,
  event_date        VARCHAR(60)   NULL,
  event_time        VARCHAR(60)   NULL,
  fee               VARCHAR(60)   NULL,
  min_team_size     SMALLINT      NULL,
  max_team_size     SMALLINT      NULL,
  max_teams         INTEGER       NULL,
  prize             VARCHAR(120)  NULL,
  active            BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- EVENT REGISTRATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_registrations (
  id                CHAR(36)      PRIMARY KEY,
  event_id          CHAR(36)      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_name         VARCHAR(120)  NULL,
  leader_user_id    CHAR(36)      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status            VARCHAR(20)   NOT NULL DEFAULT 'confirmed',
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reg_event ON event_registrations (event_id, status);

-- Members of a team registration (leader included).
CREATE TABLE IF NOT EXISTS registration_members (
  id                CHAR(36)      PRIMARY KEY,
  registration_id   CHAR(36)      NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  user_id           CHAR(36)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_leader         BOOLEAN       NOT NULL DEFAULT FALSE,
  joined_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_member_once_per_event UNIQUE (registration_id, user_id)
);

-- A user may only be registered once for a given event (as leader or member) —
-- enforced app-side (registration_service.py), same as before.

CREATE TABLE IF NOT EXISTS audit_log (
  id                CHAR(36)      PRIMARY KEY,
  actor             VARCHAR(120)  NULL,
  action            VARCHAR(80)   NOT NULL,
  target            VARCHAR(120)  NULL,
  meta_json         JSONB         NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Convenience view: live seats-available per event.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW event_seat_counts AS
SELECT
  e.id                 AS event_id,
  e.max_teams,
  COUNT(r.id)           AS teams_registered,
  CASE
    WHEN e.max_teams IS NULL THEN NULL
    ELSE GREATEST(e.max_teams - COUNT(r.id), 0)
  END                   AS seats_available
FROM events e
LEFT JOIN event_registrations r
  ON r.event_id = e.id AND r.status = 'confirmed'
GROUP BY e.id, e.max_teams;
