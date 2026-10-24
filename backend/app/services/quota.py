"""Per-tenant plan quota enforcement (finding H-04)."""

import datetime
import uuid
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.chat_message import ChatMessage
from app.models.document import Document

_DEFAULT_DOC_LIMIT = 10
_DEFAULT_MSG_LIMIT = 500


def enforce_document_quota(db: Session, tenant_id: uuid.UUID, plan: str) -> None:
    """Reject a new document when the tenant is at its plan's document limit."""
    limit = settings.PLAN_MAX_DOCUMENTS.get(plan, _DEFAULT_DOC_LIMIT)
    count = (
        db.query(func.count(Document.id))
        .filter(Document.tenant_id == tenant_id)
        .scalar()
        or 0
    )
    if count >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"Document limit ({limit}) reached for the '{plan}' plan. "
                "Delete a document or upgrade your plan."
            ),
        )


def enforce_message_quota(db: Session, tenant_id: uuid.UUID, plan: str) -> None:
    """Reject a new chat message when the tenant is at its monthly message limit."""
    limit = settings.PLAN_MAX_MESSAGES_PER_MONTH.get(plan, _DEFAULT_MSG_LIMIT)
    now = datetime.datetime.now(datetime.timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    count = (
        db.query(func.count(ChatMessage.id))
        .filter(
            ChatMessage.tenant_id == tenant_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= month_start,
        )
        .scalar()
        or 0
    )
    if count >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Monthly message limit reached for your plan. Please try again next month or upgrade.",
        )
