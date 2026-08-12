from flask import Blueprint, request, jsonify, session

from extensions import limiter
from services import otp_service
from services import user_service
from services import registration_service as regs
from services.event_service import get_event
from utils.validators import (
    validate_email_payload,
    validate_otp_payload,
    validate_login_payload,
    validate_profile_payload,
    ValidationError,
)
from utils.auth import user_login_required
from utils.logger import get_logger

bp = Blueprint("auth", __name__, url_prefix="/api/auth")
logger = get_logger("auth")


@bp.post("/request-otp")
@limiter.limit("5 per minute")
def request_otp():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "request body must be valid JSON"}), 400
    try:
        clean = validate_email_payload(payload)
    except ValidationError as e:
        return jsonify({"error": "validation failed", "fields": e.errors}), 422

    try:
        otp_service.request_otp(clean["email"])
    except otp_service.EmailAlreadyRegisteredError:
        return jsonify({"error": "an account already exists for this email"}), 409
    except otp_service.CooldownError:
        return jsonify({"error": "an OTP was just sent — wait a minute before requesting another"}), 429

    return jsonify({"ok": True})


@bp.post("/verify-otp")
@limiter.limit("10 per minute")
def verify_otp():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "request body must be valid JSON"}), 400
    try:
        clean = validate_otp_payload(payload)
    except ValidationError as e:
        return jsonify({"error": "validation failed", "fields": e.errors}), 422

    try:
        user = otp_service.verify_otp_and_create_user(clean["email"], clean["otp"])
    except otp_service.ExpiredOtpError:
        return jsonify({"error": "OTP expired — request a new one"}), 410
    except otp_service.TooManyAttemptsError:
        return jsonify({"error": "too many incorrect attempts — request a new OTP"}), 429
    except otp_service.InvalidOtpError:
        return jsonify({"error": "incorrect OTP"}), 422
    except otp_service.EmailAlreadyRegisteredError:
        return jsonify({"error": "an account already exists for this email"}), 409

    logger.info("account created user=%s email=%s", user.id, user.email)
    # Credentials were emailed — nothing sensitive comes back in the response.
    return jsonify({"ok": True, "message": "Check your email for your token, username, and password."})


@bp.post("/login")
@limiter.limit("10 per minute")
def login():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "request body must be valid JSON"}), 400
    try:
        creds = validate_login_payload(payload)
    except ValidationError as e:
        return jsonify({"error": "validation failed", "fields": e.errors}), 422

    user = user_service.verify_user_credentials(creds["username"], creds["password"])
    if not user:
        return jsonify({"error": "invalid username or password"}), 401

    session.clear()
    session["user_id"] = user.id
    session.permanent = True
    return jsonify({"user": user.to_public_dict(), "must_change_password": user.must_change_password})


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@bp.get("/me")
@user_login_required
def me():
    user = user_service.get_user(session["user_id"])
    if not user:
        session.clear()
        return jsonify({"error": "authentication required"}), 401
    return jsonify(user.to_public_dict())


@bp.post("/profile")
@user_login_required
def complete_profile():
    user = user_service.get_user(session["user_id"])
    if not user:
        session.clear()
        return jsonify({"error": "authentication required"}), 401

    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "request body must be valid JSON"}), 400
    try:
        clean = validate_profile_payload(payload)
    except ValidationError as e:
        return jsonify({"error": "validation failed", "fields": e.errors}), 422

    user = user_service.complete_profile(user, clean)
    return jsonify(user.to_public_dict())


@bp.post("/change-password")
@user_login_required
@limiter.limit("10 per minute")
def change_password():
    user = user_service.get_user(session["user_id"])
    if not user:
        session.clear()
        return jsonify({"error": "authentication required"}), 401

    payload = request.get_json(silent=True) or {}
    new_password = payload.get("new_password", "")
    if not isinstance(new_password, str) or len(new_password) < 8 or len(new_password) > 128:
        return jsonify({"error": "password must be 8-128 characters"}), 422

    user_service.change_password(user, new_password)
    return jsonify({"ok": True})


@bp.get("/me/events")
@user_login_required
def my_events():
    user = user_service.get_user(session["user_id"])
    if not user:
        session.clear()
        return jsonify({"error": "authentication required"}), 401

    from models import EventRegistration, RegistrationMember

    registrations = (
        EventRegistration.query.join(RegistrationMember)
        .filter(RegistrationMember.user_id == user.id, EventRegistration.status == "confirmed")
        .all()
    )
    out = []
    for reg in registrations:
        event = get_event(reg.event_id)
        out.append(
            {
                "registration_id": reg.id,
                "event_id": reg.event_id,
                "event_name": event.name if event else reg.event_id,
                "team_name": reg.team_name,
                "is_leader": any(m.user_id == user.id and m.is_leader for m in reg.members),
                "members": [
                    {"name": m.user.full_name or m.user.username, "token": m.user.cybercarnival_token}
                    for m in reg.members
                ],
                "venue": event.venue if event else None,
                "date": event.event_date if event else None,
                "time": event.event_time if event else None,
            }
        )
    return jsonify(out)
