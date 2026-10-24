"""Helper to persist audit-log entries for sensitive admin actions (finding M-02)."""

import logging
import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def record_audit(
    db: Session,
    actor_email: str,
    action: str,
    target_tenant_id: Optional[uuid.UUID] = None,
    actor_id: Optional[uuid.UUID] = None,
    detail: Optional[str] = None,
) -> None:
    """Write one audit entry. Never raises — auditing must not break the action."""
    try:
        entry = AuditLog(
            actor_email=actor_email,
            actor_id=actor_id,
            action=action,
            target_tenant_id=target_tenant_id,
            detail=detail,
        )
        db.add(entry)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to write audit log (%s by %s): %s", action, actor_email, exc)
        db.rollback()
