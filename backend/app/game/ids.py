import secrets
import string

ROOM_CODE_ALPHABET = string.ascii_uppercase.replace("O", "").replace("I", "")


def generate_room_code(length: int = 5) -> str:
    return "".join(secrets.choice(ROOM_CODE_ALPHABET) for _ in range(length))


def generate_session_token() -> str:
    return secrets.token_urlsafe(24)
