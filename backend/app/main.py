from contextlib import asynccontextmanager
from fastapi import FastAPI
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

@app.get("/", tags=["Root"])
async def root():
    """Welcome endpoint. this is the root route of the backend service"""
    return {
        "message": "Welcome to BotForge API. Visit /docs for Swagger UI or /health for service health."
    }

