from collections.abc import Callable
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from typing import Final, Literal

from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import User


Role = Literal[
    "patient",
    "doctor",
    "admin",
]

VALID_ROLES: Final[
    frozenset[str]
] = frozenset(
    {
        "patient",
        "doctor",
        "admin",
    }
)

ACCESS_TOKEN_TYPE: Final = "access"

password_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

bearer_scheme = HTTPBearer(
    auto_error=False,
)


def credentials_exception(
    detail: str = (
        "Authentication credentials "
        "are invalid or expired"
    ),
) -> HTTPException:
    return HTTPException(
        status_code=(
            status.HTTP_401_UNAUTHORIZED
        ),
        detail=detail,
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


def hash_password(
    value: str,
) -> str:
    return password_context.hash(value)


def verify_password(
    value: str,
    hashed: str,
) -> bool:
    try:
        return password_context.verify(
            value,
            hashed,
        )
    except (ValueError, TypeError):
        return False


def create_token(
    user: User,
) -> str:
    if user.role not in VALID_ROLES:
        raise ValueError(
            f"Unsupported user role: "
            f"{user.role}"
        )

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "type": ACCESS_TOKEN_TYPE,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": now,
        "nbf": now,
        "exp": now
        + timedelta(
            minutes=(
                settings
                .jwt_expire_minutes
            )
        ),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=(
            settings.jwt_algorithm
        ),
    )


def decode_access_token(
    token: str,
) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[
                settings.jwt_algorithm
            ],
            audience=(
                settings.jwt_audience
            ),
            issuer=(
                settings.jwt_issuer
            ),
            options={
                "require_sub": True,
                "require_exp": True,
                "require_iat": True,
                "require_aud": True,
                "require_iss": True,
            },
        )
    except JWTError as exc:
        raise credentials_exception() from exc

    if (
        payload.get("type")
        != ACCESS_TOKEN_TYPE
    ):
        raise credentials_exception(
            "Invalid token type"
        )

    role = payload.get("role")

    if role not in VALID_ROLES:
        raise credentials_exception(
            "Invalid token role"
        )

    return payload


def current_user(
    credentials: (
        HTTPAuthorizationCredentials
        | None
    ) = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise credentials_exception(
            "Authentication token is required"
        )

    if (
        credentials.scheme.lower()
        != "bearer"
    ):
        raise credentials_exception(
            "Bearer authentication is required"
        )

    payload = decode_access_token(
        credentials.credentials
    )

    try:
        user_id = int(payload["sub"])
    except (
        KeyError,
        TypeError,
        ValueError,
    ) as exc:
        raise credentials_exception(
            "Invalid token subject"
        ) from exc

    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise credentials_exception(
            "User account does not exist"
        )

    if not user.active:
        raise credentials_exception(
            "User account is inactive"
        )

    if user.role not in VALID_ROLES:
        raise credentials_exception(
            "User role is invalid"
        )

    # The database role remains
    # authoritative. A token issued before
    # a role change must not grant the old
    # permissions.
    token_role = payload.get("role")

    if token_role != user.role:
        raise credentials_exception(
            "User permissions have changed. "
            "Please sign in again."
        )

    return user


def require_roles(
    *roles: Role,
) -> Callable:
    invalid_roles = set(
        roles
    ) - VALID_ROLES

    if invalid_roles:
        raise ValueError(
            "Unsupported roles: "
            + ", ".join(
                sorted(invalid_roles)
            )
        )

    def dependency(
        user: User = Depends(
            current_user
        ),
    ) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_403_FORBIDDEN
                ),
                detail=(
                    "You do not have "
                    "permission to perform "
                    "this action"
                ),
            )

        return user

    return dependency