from extensions import db
from models import User
from utils.security import verify_password, hash_password


def get_user_by_username(username: str):
    return User.query.filter_by(username=username).first()


def get_user_by_token(token: str):
    return User.query.filter_by(cybercarnival_token=token).first()


def get_user(user_id: str):
    return db.session.get(User, user_id)


def verify_user_credentials(username: str, password: str):
    """Returns the User on success, None otherwise. Same timing-safe pattern as
    verify_admin_credentials — always runs a hash check either way."""
    user = get_user_by_username(username)
    if not user or not user.is_active:
        verify_password(password, hash_password("decoy-password-not-real"))
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def complete_profile(user: User, clean_data: dict) -> User:
    user.full_name = clean_data["full_name"]
    user.phone = clean_data["phone"]
    user.college = clean_data.get("college", "")
    user.profile_completed = True
    db.session.commit()
    return user


def change_password(user: User, new_password: str) -> None:
    user.password_hash = hash_password(new_password)
    user.must_change_password = False
    db.session.commit()
