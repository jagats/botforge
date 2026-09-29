from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="BotForge API",
    version="0.1.0",
    description="Multi-tenant AI Bot-as-a-Service Platform",
)

# Enable CORS for local Next.js frontend and widget embedding
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "ok",
        "service": "botforge-backend",
        "version": "0.1.0",
    }

@app.get("/", tags=["Root"])
async def root():
    """Welcome endpoint."""
    return {
        "message": "Welcome to BotForge API. Visit /docs for Swagger UI or /health for service health."
    }
