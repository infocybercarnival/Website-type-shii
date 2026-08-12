from extensions import db
from models import Event, EventRegistration, RegistrationMember, User


class DuplicateRegistrationError(Exception):
    """This user (leader or a listed member) is already registered for this event."""


class EventNotFoundError(Exception):
    pass


class EventFullError(Exception):
    pass


class UnknownMemberTokenError(Exception):
    def __init__(self, token):
        self.token = token
        super().__init__(token)


def _already_registered(event_id: str, user_id: str) -> bool:
    return (
        RegistrationMember.query.join(EventRegistration)
        .filter(
            EventRegistration.event_id == event_id,
            EventRegistration.status == "confirmed",
            RegistrationMember.user_id == user_id,
        )
        .first()
        is not None
    )


def register_for_event(leader: User, clean_data: dict) -> EventRegistration:
    event = db.session.get(Event, clean_data["event_id"])
    if not event or not event.active:
        raise EventNotFoundError(clean_data["event_id"])

    if event.max_teams is not None and event.teams_registered() >= event.max_teams:
        raise EventFullError(event.id)

    if _already_registered(event.id, leader.id):
        raise DuplicateRegistrationError(leader.id)

    member_users = []
    for token in clean_data.get("member_tokens", []):
        member = User.query.filter_by(cybercarnival_token=token).first()
        if not member:
            raise UnknownMemberTokenError(token)
        if member.id == leader.id:
            continue
        if _already_registered(event.id, member.id):
            raise DuplicateRegistrationError(member.id)
        member_users.append(member)

    registration = EventRegistration(
        event_id=event.id,
        team_name=clean_data.get("team_name") or None,
        leader_user_id=leader.id,
        status="confirmed",
    )
    db.session.add(registration)
    db.session.flush()  # get registration.id before adding members

    db.session.add(RegistrationMember(registration_id=registration.id, user_id=leader.id, is_leader=True))
    for member in member_users:
        db.session.add(RegistrationMember(registration_id=registration.id, user_id=member.id, is_leader=False))

    db.session.commit()
    return registration


def list_registrations(event_id: str = None) -> list:
    q = EventRegistration.query
    if event_id:
        q = q.filter_by(event_id=event_id)
    return q.order_by(EventRegistration.created_at.desc()).all()


def get_registration(registration_id: str):
    return db.session.get(EventRegistration, registration_id)


def set_status(registration_id: str, status: str) -> bool:
    allowed = {"confirmed", "cancelled"}
    if status not in allowed:
        raise ValueError("invalid status")
    reg = get_registration(registration_id)
    if not reg:
        return False
    reg.status = status
    db.session.commit()
    return True


def delete_registration(registration_id: str) -> bool:
    reg = get_registration(registration_id)
    if not reg:
        return False
    db.session.delete(reg)
    db.session.commit()
    return True


def counts_by_event() -> dict:
    rows = (
        db.session.query(EventRegistration.event_id, db.func.count(EventRegistration.id))
        .filter(EventRegistration.status == "confirmed")
        .group_by(EventRegistration.event_id)
        .all()
    )
    return {event_id: count for event_id, count in rows}


def registered_user_ids() -> set:
    """Every user who is a member (leader or not) of at least one confirmed
    registration — used by the admin 'registered vs logged-in-only' split."""
    rows = (
        db.session.query(RegistrationMember.user_id)
        .join(EventRegistration)
        .filter(EventRegistration.status == "confirmed")
        .distinct()
        .all()
    )
    return {r[0] for r in rows}
