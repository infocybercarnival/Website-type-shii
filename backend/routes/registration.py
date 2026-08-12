from flask import Blueprint, request, jsonify, session

from extensions import limiter
from services.registration_service import (
    register_for_event,
    DuplicateRegistrationError,
    EventNotFoundError,
    EventFullError,
    UnknownMemberTokenError,
)
from services.user_service import get_user
from utils.validators import validate_event_registration_payload, ValidationError
from utils.auth import user_login_required
from utils.logger import get_logger

bp = Blueprint("registration", __name__)
logger = get_logger("registration")


@bp.post("/api/registrations")
@user_login_required
@limiter.limit("10 per minute")
def submit_registration():
    leader = get_user(session["user_id"])
    if not leader:
        session.clear()
        return jsonify({"error": "authentication required"}), 401
    if not leader.profile_completed:
        return jsonify({"error": "complete your profile before registering for an event"}), 409

    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "request body must be valid JSON"}), 400

    try:
        clean = validate_event_registration_payload(payload)
    except ValidationError as e:
        return jsonify({"error": "validation failed", "fields": e.errors}), 422

    try:
        record = register_for_event(leader, clean)
    except EventNotFoundError:
        return jsonify({"error": "unknown or inactive event_id"}), 404
    except EventFullError:
        return jsonify({"error": "this event is at capacity"}), 409
    except DuplicateRegistrationError:
        return jsonify({"error": "you (or a teammate) are already registered for this event"}), 409
    except UnknownMemberTokenError as e:
        return jsonify({"error": f"no account found for token {e.token}"}), 404

    logger.info("registration created id=%s event=%s leader=%s", record.id, record.event_id, leader.id)
    return jsonify({"id": record.id, "status": record.status}), 201
