"""FastAPI dependencies shared across routers."""

import uuid

# Fixed seed user during single-user MVP. Adım 10'da JWT auth wired in,
# bu fonksiyon o zaman token'dan user_id çözecek.
SEED_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def get_current_user_id() -> uuid.UUID:
    """Return the current user's UUID.

    MVP-only single-user mode — always the seed user. Replaced in Adım 10 with
    a real JWT-based resolver. The signature is intentionally stable so callers
    won't change when auth lands.
    """
    return SEED_USER_ID
