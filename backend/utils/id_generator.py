import random
import secrets
import string
import uuid


def new_uuid() -> str:
    """UUID4 registration/record ID. Stable, unguessable, safe to expose to the client."""
    return str(uuid.uuid4())


_TOKEN_ALPHABET = string.ascii_uppercase + string.digits
# Characters that are easy to misread when a participant is typing a
# teammate's token off a phone screen — dropped to cut transcription errors.
_TOKEN_ALPHABET = _TOKEN_ALPHABET.translate({ord(c): None for c in "O0I1"})


def new_cybercarnival_token() -> str:
    """16-character public participant token, e.g. 'CC3F7K9X2M4P8QRT'. Uniqueness is
    enforced by the caller (retry on IntegrityError) since it isn't checked here."""
    return "CC" + "".join(secrets.choice(_TOKEN_ALPHABET) for _ in range(14))


def new_otp_code(length: int = 6) -> str:
    return "".join(str(random.SystemRandom().randint(0, 9)) for _ in range(length))


def new_username(full_name_hint: str = "") -> str:
    """System-generated username. Not derived from anything guessable beyond
    a random suffix — kept simple since the account is really keyed by email/token."""
    return "cc" + secrets.token_hex(4)


def new_temp_password() -> str:
    """System-generated temporary password, emailed once, must be changed on first login."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(10))

