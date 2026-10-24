"""Authentication endpoints: signup, login, me."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
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
    response: Response,
    db: Session = Depends(get_db),
) -> LoginResponse:
    """Verify email and password, check tenant status, issue JWT, and set role-separated HttpOnly cookie."""
    auth_res = login_user(db, payload)
    
    # Isolate superadmin session cookie from owner/tenant session cookie
    cookie_name = "botforge_admin_token" if auth_res.role == "superadmin" else "botforge_user_token"
    max_age_secs = settings.JWT_EXPIRE_MINUTES * 60
    is_prod = settings.ENVIRONMENT.lower() == "production"

    response.set_cookie(
        key=cookie_name,
        value=auth_res.access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=max_age_secs,
        path="/",
    )
    # Optionally withhold the token from the JSON body so only the HttpOnly cookie
    # carries it, keeping it out of reach of XSS (finding M-01).
    if not settings.EXPOSE_TOKEN_IN_BODY:
        auth_res.access_token = ""
    return auth_res


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Clear authentication session cookies",
)
def logout(response: Response):
    """Clear all session cookies (admin, user, and impersonation)."""
    for cookie_name in (
        "botforge_admin_token",
        "botforge_user_token",
        "botforge_impersonation_token",
        "botforge_access_token",
        "botforge_token",
    ):
        response.delete_cookie(
            key=cookie_name,
            path="/",
            httponly=True,
            samesite="lax",
        )
    return {"message": "Successfully logged out"}


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
