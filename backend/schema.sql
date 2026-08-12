-- CyberCarnival — MySQL schema (phase 2: accounts, tokens, teams, editable events)
-- Target: MySQL 8.0+ (needs CHECK constraint + utf8mb4 support)
-- Replaces the current JSON-file storage in backend/data/*.json.

CREATE DATABASE IF NOT EXISTS cybercarnival
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cybercarnival;

-- ---------------------------------------------------------------------------
-- ADMINS — unchanged shape from data/admins.json, just moved into MySQL.
-- ---------------------------------------------------------------------------
CREATE TABLE admins (
  id                CHAR(36)      PRIMARY KEY,
  username          VARCHAR(64)   NOT NULL UNIQUE,
  password_hash     VARCHAR(255)  NOT NULL,
  created_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

-- Seed admin — same account/hash as the current JSON store (data/admins.json),
-- so login (admin / admin@123) keeps working once this table replaces the file.
INSERT INTO admins (id, username, password_hash) VALUES (
  'a6ea1140-5dfb-4a54-a370-2bfdab936e01',
  'admin',
  'scrypt:32768:8:1$nBwzpMhf5Gxs0wiM$ca285082ee0b1509d0a37a05f7504c71761d8f71b900689c36c6005db2231d17a58f90947139c1c6bf15bf360d2e566a13c293b486cae690e25730f5748629cb'
);

-- ---------------------------------------------------------------------------
-- OTP flow — step 1 of registration. One row per email/OTP attempt.
-- Nothing else is created until the OTP is verified.
-- ---------------------------------------------------------------------------
CREATE TABLE otp_verifications (
  id                CHAR(36)      PRIMARY KEY,
  email             VARCHAR(255)  NOT NULL,
  otp_hash          VARCHAR(255)  NOT NULL,       -- hash of the 6-digit code, never store plaintext
  purpose           VARCHAR(32)   NOT NULL DEFAULT 'signup',
  attempts          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts      TINYINT UNSIGNED NOT NULL DEFAULT 5,
  consumed_at       DATETIME(3)   NULL,
  expires_at        DATETIME(3)   NOT NULL,
  created_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_otp_email (email),
  INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- USERS — created only after OTP verification succeeds. cybercarnival_token
-- is the public 16-char identifier participants share with teammates; id
-- (UUID) stays internal, same pattern the JSON store already uses for events.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                  CHAR(36)      PRIMARY KEY,
  cybercarnival_token CHAR(16)      NOT NULL UNIQUE,   -- e.g. "CCXXXXXXXXXXXXX", generated server-side
  username            VARCHAR(32)   NOT NULL UNIQUE,   -- system-generated at OTP verification
  password_hash       VARCHAR(255)  NOT NULL,          -- system-generated temp password, hashed (bcrypt/argon2)
  must_change_password BOOLEAN      NOT NULL DEFAULT TRUE,
  email               VARCHAR(255)  NOT NULL UNIQUE,    -- same email verified via OTP, locked after signup
  full_name           VARCHAR(120)  NULL,
  phone                VARCHAR(20)   NULL,
  college              VARCHAR(150)  NULL,
  profile_completed   BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_users_email (email),
  INDEX idx_users_token (cybercarnival_token)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- EVENTS — fully editable from the admin panel. seats_available is a
-- generated/derived value (see event_registration_counts view below); the
-- source of truth for capacity is max_teams.
-- ---------------------------------------------------------------------------
CREATE TABLE events (
  id                CHAR(36)      PRIMARY KEY,
  name              VARCHAR(150)  NOT NULL,
  category          VARCHAR(30)   NOT NULL DEFAULT 'TECHNICAL',  -- TECHNICAL / NON-TECHNICAL
  tag               VARCHAR(40)   NULL,          -- e.g. "COMPETITION", "PANEL"
  description       TEXT          NULL,
  poster_url        VARCHAR(500)  NULL,           -- uploaded poster path/URL
  venue             VARCHAR(200)  NULL,
  event_date        VARCHAR(60)   NULL,           -- kept as display text (existing data uses ranges like "7 — 8 OCTOBER")
  event_time        VARCHAR(60)   NULL,
  fee               VARCHAR(60)   NULL,            -- display text, e.g. "₹250 PER TEAM" (kept as string like current data)
  min_team_size     TINYINT UNSIGNED NULL,
  max_team_size     TINYINT UNSIGNED NULL,
  max_teams         INT UNSIGNED  NULL,            -- capacity; NULL = unlimited
  prize             VARCHAR(120)  NULL,
  active            BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- EVENT REGISTRATIONS — one row per team (or solo participant) entering one
-- event. This is what "seats available" counts against max_teams.
-- ---------------------------------------------------------------------------
CREATE TABLE event_registrations (
  id                CHAR(36)      PRIMARY KEY,
  event_id          CHAR(36)      NOT NULL,
  team_name         VARCHAR(120)  NULL,
  leader_user_id    CHAR(36)      NOT NULL,        -- user who registered the team
  status            VARCHAR(20)   NOT NULL DEFAULT 'confirmed',  -- confirmed / cancelled
  created_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_reg_event  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_leader FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_reg_event (event_id, status)
) ENGINE=InnoDB;

-- Members of a team registration (leader included), keyed by their
-- cybercarnival_token at add-time so the flow matches "add your friend's
-- token to bring them into the team".
CREATE TABLE registration_members (
  id                CHAR(36)      PRIMARY KEY,
  registration_id   CHAR(36)      NOT NULL,
  user_id           CHAR(36)      NOT NULL,
  is_leader         BOOLEAN       NOT NULL DEFAULT FALSE,
  joined_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_member_reg  FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_member_once_per_event (registration_id, user_id)
) ENGINE=InnoDB;

-- A user may only be registered once for a given event (as leader or member) —
-- enforced in the service layer by joining registration_members -> event_registrations
-- and checking (event_id, user_id) before insert. (MySQL can't express a
-- cross-table uniqueness constraint directly, so this stays an app-level check,
-- same as the existing DuplicateRegistrationError in registration_service.py.)

CREATE TABLE audit_log (
  id                CHAR(36)      PRIMARY KEY,
  actor             VARCHAR(120)  NULL,
  action            VARCHAR(80)   NOT NULL,
  target             VARCHAR(120)  NULL,
  meta_json         JSON          NULL,
  created_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Convenience view: live seats-available per event, what the frontend polls.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW event_seat_counts AS
SELECT
  e.id                AS event_id,
  e.max_teams,
  COUNT(r.id)          AS teams_registered,
  CASE
    WHEN e.max_teams IS NULL THEN NULL
    ELSE GREATEST(e.max_teams - COUNT(r.id), 0)
  END                  AS seats_available
FROM events e
LEFT JOIN event_registrations r
  ON r.event_id = e.id AND r.status = 'confirmed'
GROUP BY e.id, e.max_teams;
