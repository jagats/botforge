import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1 import api_v1_router
from app.core.config import settings
from app.core.qdrant import init_qdrant_collection
from app.db.seed import seed_superadmin
from app.db.session import SessionLocal


# Advisory-lock key so only one worker runs startup init at a time (finding P-05).
_STARTUP_LOCK_KEY = 727274


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Serialize startup work across Gunicorn/Uvicorn workers with a Postgres advisory
    # lock so they don't race on seeding or Qdrant collection creation.
    db = SessionLocal()
    try:
        db.execute(text("SELECT pg_advisory_lock(:k)"), {"k": _STARTUP_LOCK_KEY})
        try:
            init_qdrant_collection()
            seed_superadmin(db)
        finally:
            db.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": _STARTUP_LOCK_KEY})
            db.commit()
    finally:
        db.close()
    yield


_IS_PROD = settings.ENVIRONMENT.lower() == "production"

app = FastAPI(
    title="BotForge API",
    version="0.1.0",
    description="Multi-tenant AI Bot-as-a-Service Platform",
    lifespan=lifespan,
    # Disable interactive API docs & schema in production (finding M-04).
    docs_url=None if _IS_PROD else "/docs",
    redoc_url=None if _IS_PROD else "/redoc",
    openapi_url=None if _IS_PROD else "/openapi.json",
)

_DOCS_PATHS = ("/docs", "/redoc", "/openapi.json")

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


@app.middleware("http")
async def security_headers_middleware(request, call_next):
    """Add baseline security headers to every response (finding M-07)."""
    response = await call_next(request)
    path = request.url.path
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    if _IS_PROD:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    # Strict CSP for API responses; skip docs so Swagger/ReDoc keep working in dev.
    if not any(path.startswith(p) for p in _DOCS_PATHS):
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
        )
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

_WIDGET_JS_PATH = os.path.join(os.path.dirname(__file__), "static", "widget.js")
_widget_js_cache: str | None = None  # read from disk once, then served from memory (P-06)


@app.api_route("/widget.js", methods=["GET", "HEAD"], tags=["Widget"])
async def serve_widget_script():
    """Serve the standalone embeddable chat widget script bundle (cached in memory)."""
    global _widget_js_cache
    if _widget_js_cache is None and os.path.exists(_WIDGET_JS_PATH):
        with open(_WIDGET_JS_PATH, "r", encoding="utf-8") as f:
            _widget_js_cache = f.read()

    if _widget_js_cache is not None:
        return Response(
            content=_widget_js_cache,
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


