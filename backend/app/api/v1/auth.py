"""Authentication endpoints: signup, login, me."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import rate_limit_auth
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserMeResponse,
)
from app.services.auth_service import get_user_profile, login_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_auth)],
    summary="Authenticate user and receive access token",
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> LoginResponse:
    """Verify email and password, check tenant status, and issue a JWT bearer token."""
    return login_user(db, payload)


@router.get(
    "/me",
    response_model=UserMeResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve current user profile and tenant information",
)
def me(
    current_user: User = Depends(get_current_user),
) -> UserMeResponse:
    """Return identity and tenant organization details for the authenticated session."""
    return get_user_profile(current_user)
