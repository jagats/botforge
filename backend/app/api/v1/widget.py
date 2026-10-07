"""Public widget API routes authenticated via public API key."""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_tenant_by_api_key, get_tenant_id_by_api_key
from app.db.session import get_db
from app.models.tenant import Tenant
from app.schemas.chat import ChatRequest
from app.schemas.widget import (
    WidgetChatRequest,
    WidgetChatResponse,
    WidgetConfigResponse,
)
from app.services.chat_service import process_chat_message

router = APIRouter(prefix="/widget", tags=["Widget"])


@router.post(
    "/chat",
    response_model=WidgetChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Public chatbot conversation endpoint for website embed widget",
)
async def widget_chat_endpoint(
    req: WidgetChatRequest,
    tenant_id: uuid.UUID = Depends(get_tenant_id_by_api_key),
    db: Session = Depends(get_db),
) -> WidgetChatResponse:
    """
    Public widget chat endpoint:
    - Validates public API key provided in 'X-Public-Key' header or Bearer header
    - Resolves organization tenant and verifies active account status
    - Queries tenant-scoped vector index in Qdrant and generates grounded response
    - Returns answer with active session UUID
    """
    chat_req = ChatRequest(
        session_id=req.session_id,
        message=req.message,
    )
    result = await process_chat_message(db=db, tenant_id=tenant_id, req=chat_req)

    return WidgetChatResponse(
        session_id=result.session_id,
        answer=result.answer,
        sources=result.sources,
    )


@router.get(
    "/config",
    response_model=WidgetConfigResponse,
    status_code=status.HTTP_200_OK,
    summary="Get public configuration and company branding for widget",
)
def widget_config_endpoint(
    tenant: Tenant = Depends(get_tenant_by_api_key),
) -> WidgetConfigResponse:
    """
    Returns public branding details (company name, bot title, welcome message)
    for the widget client based on the public API key.
    """
    return WidgetConfigResponse(
        tenant_id=tenant.id,
        company_name=tenant.name,
        bot_name=f"{tenant.name} AI Assistant",
        welcome_message=f"Hi there! 👋 How can I help you with {tenant.name} today?",
        status=tenant.status,
    )
