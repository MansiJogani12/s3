from typing import Optional
from datetime import datetime, timezone

from app.models.audit_log import AuditLog
from app.models.user import User
from fastapi import Request


async def log_audit_event(
    action: str,
    actor: Optional[User] = None,
    target_entity: str = "",
    target_id: str = "",
    details: dict = {},
    request: Optional[Request] = None,
) -> None:
    """Record an audit event in the database. Failures are silently swallowed."""
    try:
        ip_address = ""
        if request:
            forwarded = request.headers.get("x-forwarded-for")
            ip_address = forwarded.split(",")[0] if forwarded else (request.client.host if request.client else "")

        await AuditLog(
            actor_id=actor.id if actor else None,
            actor_role=actor.role if actor else "SYSTEM",
            actor_name=actor.name if actor else "System",
            action=action,
            target_entity=target_entity,
            target_id=str(target_id),
            details=details,
            ip_address=ip_address,
        ).insert()
    except Exception as e:
        print(f"[AuditLog Error]: Failed to record event {action}: {e}")
