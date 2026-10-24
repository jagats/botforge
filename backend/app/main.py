import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_v1_router
from app.core.config import settings
from app.core.qdrant import init_qdrant_collection
from app.db.seed import seed_superadmin
from app.db.session import SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure Qdrant collection and payload indexes exist on startup
    init_qdrant_collection()
    # Ensure master superadmin user and system tenant exist
    db = SessionLocal()
    try:
        seed_superadmin(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="BotForge API",
    version="0.1.0",
    description="Multi-tenant AI Bot-as-a-Service Platform",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend with HttpOnly credentials support
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$" if settings.ENVIRONMENT == "development" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_WIDGET_PATH_PREFIX = "/api/v1/widget"


def _apply_widget_cors(response: Response, origin: str | None) -> None:
    """Permissive CORS for public widget endpoints (finding SEC-03).

    The real access control is the per-tenant domain whitelist + public key checked
    server-side, so reflecting the origin here is safe and lets the widget work on
    any client site.
    """
    response.headers["Access-Control-Allow-Origin"] = origin or "*"
    response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Public-Key, Authorization"
    response.headers["Access-Control-Max-Age"] = "600"


@app.middleware("http")
async def widget_cors_middleware(request, call_next):
    """Outermost middleware: open CORS for /api/v1/widget/* only; others stay strict."""
    is_widget = request.url.path.startswith(_WIDGET_PATH_PREFIX)
    origin = request.headers.get("origin")

    if is_widget and request.method == "OPTIONS":
        preflight = Response(status_code=200)
        _apply_widget_cors(preflight, origin)
        return preflight

    response = await call_next(request)
    if is_widget:
        _apply_widget_cors(response, origin)
    return response


# Mount API routes
app.include_router(api_v1_router)

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify backend service status. it will return the status of the backend service"""
    return {
        "status": "ok",
        "service": "botforge-backend",
        "version": "0.1.0",
    }

@app.api_route("/widget.js", methods=["GET", "HEAD"], tags=["Widget"])
async def serve_widget_script():
    """Serve the standalone embeddable chat widget script bundle."""
    static_widget_path = os.path.join(os.path.dirname(__file__), "static", "widget.js")
    if os.path.exists(static_widget_path):
        with open(static_widget_path, "r", encoding="utf-8") as f:
            content = f.read()
        return Response(
            content=content,
            media_type="application/javascript",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            },
        )
    return Response(
        content="/* BotForge widget script is compiling. Please build the widget bundle. */",
        media_type="application/javascript",
        status_code=200,
        headers={"Access-Control-Allow-Origin": "*"},
    )


