import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_v1_router
from app.core.qdrant import init_qdrant_collection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure Qdrant collection and payload indexes exist on startup
    init_qdrant_collection()
    yield


app = FastAPI(
    title="BotForge API",
    version="0.1.0",
    description="Multi-tenant AI Bot-as-a-Service Platform",
    lifespan=lifespan,
)

# Enable CORS for local Next.js frontend and widget embedding
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


