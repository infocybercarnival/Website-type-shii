from flask import Blueprint, jsonify
from services import event_service

bp = Blueprint("events", __name__)


@bp.get("/api/events")
def list_events():
    return jsonify([e.to_public_dict() for e in event_service.list_events()])


@bp.get("/api/events/<event_id>")
def get_event(event_id):
    event = event_service.get_event(event_id)
    if not event or not event.active:
        return jsonify({"error": "not found"}), 404
    return jsonify(event.to_public_dict())
