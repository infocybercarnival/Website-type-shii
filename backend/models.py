"""
SQLAlchemy models — the MySQL-backed replacement for the old JSON file store.
Mirrors schema.sql field-for-field; see that file for the full column
comments/rationale. db.create_all() (called once at startup in app.py) creates
these tables if they don't exist yet — no separate migration step needed for
this project's size.
"""
import time
import uuid

from extensions import db


def new_uuid() -> str:
    return str(uuid.uuid4())


class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column(db.String(36), primary_key=True, default=new_uuid)
    username = db.Column(db.String(64), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())


class OtpVerification(db.Model):
    __tablename__ = "otp_verifications"

    id = db.Column(db.String(36), primary_key=True, default=new_uuid)
    email = db.Column(db.String(255), nullable=False, index=True)
    otp_hash = db.Column(db.String(255), nullable=False)
    purpose = db.Column(db.String(32), nullable=False, default="signup")
    attempts = db.Column(db.SmallInteger, nullable=False, default=0)
    max_attempts = db.Column(db.SmallInteger, nullable=False, default=5)
    consumed_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=new_uuid)
    cybercarnival_token = db.Column(db.String(16), nullable=False, unique=True, index=True)
    username = db.Column(db.String(32), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    must_change_password = db.Column(db.SmallInteger, nullable=False, default=1)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    full_name = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    college = db.Column(db.String(150), nullable=True)
    profile_completed = db.Column(db.SmallInteger, nullable=False, default=0)
    is_active = db.Column(db.SmallInteger, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_public_dict(self):
        return {
            "id": self.id,
            "cybercarnival_token": self.cybercarnival_token,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "college": self.college,
            "profile_completed": self.profile_completed,
        }


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.String(36), primary_key=True, default=new_uuid)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(30), nullable=False, default="TECHNICAL")
    tag = db.Column(db.String(40), nullable=True)
    description = db.Column(db.Text, nullable=True)
    poster_url = db.Column(db.String(500), nullable=True)
    venue = db.Column(db.String(200), nullable=True)
    event_date = db.Column(db.String(60), nullable=True)
    event_time = db.Column(db.String(60), nullable=True)
    fee = db.Column(db.String(60), nullable=True)
    min_team_size = db.Column(db.SmallInteger, nullable=True)
    max_team_size = db.Column(db.SmallInteger, nullable=True)
    max_teams = db.Column(db.Integer, nullable=True)
    prize = db.Column(db.String(120), nullable=True)
    active = db.Column(db.SmallInteger, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def seats_available(self):
        if self.max_teams is None:
            return None
        confirmed = EventRegistration.query.filter_by(event_id=self.id, status="confirmed").count()
        return max(self.max_teams - confirmed, 0)

    def teams_registered(self):
        return EventRegistration.query.filter_by(event_id=self.id, status="confirmed").count()

    def to_public_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "tag": self.tag,
            "description": self.description,
            "poster_url": self.poster_url,
            "venue": self.venue,
            "date": self.event_date,
            "time": self.event_time,
            "fee": self.fee,
            "min_team_size": self.min_team_size,
            "max_team_size": self.max_team_size,
            "max_teams": self.max_teams,
            "teams_registered": self.teams_registered(),
            "seats_available": self.seats_available(),
            "prize": self.prize,
        }

    def to_admin_dict(self):
        d = self.to_public_dict()
        d["active"] = self.active
        d["created_at"] = self.created_at.timestamp() if self.created_at else None
        return d


class EventRegistration(db.Model):
    __tablename__ = "event_registrations"

    id = db.Column(db.String(36), primary_key=True, default=new_uuid)
    event_id = db.Column(db.String(36), db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    team_name = db.Column(db.String(120), nullable=True)
    leader_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="confirmed")
    created_at = db.Column(db.DateTime, default=db.func.now())

    event = db.relationship("Event")
    leader = db.relationship("User", foreign_keys=[leader_user_id])
    members = db.relationship("RegistrationMember", backref="registration", cascade="all, delete-orphan")


class RegistrationMember(db.Model):
    __tablename__ = "registration_members"
    __table_args__ = (db.UniqueConstraint("registration_id", "user_id", name="uq_member_once_per_event"),)

    id = db.Column(db.String(36), primary_key=True, default=new_uuid)
    registration_id = db.Column(db.String(36), db.ForeignKey("event_registrations.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_leader = db.Column(db.SmallInteger, nullable=False, default=0)
    joined_at = db.Column(db.DateTime, default=db.func.now())

    user = db.relationship("User")


class AuditLogEntry(db.Model):
    __tablename__ = "audit_log"

    id = db.Column(db.String(36), primary_key=True, default=new_uuid)
    actor = db.Column(db.String(120), nullable=True)
    action = db.Column(db.String(80), nullable=False)
    target = db.Column(db.String(120), nullable=True)
    meta_json = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
