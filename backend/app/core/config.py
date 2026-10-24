"""Application configuration via pydantic-settings."""

import socket
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Known insecure defaults that must never be used in production.
_DEFAULT_SECRET_KEY = "insecure-default-secret-change-in-production"
_DEFAULT_SUPERADMIN_PASSWORD = "Admin@BotForge2026!"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    ENVIRONMENT: str = "development"
    BACKEND_PORT: int = 8000

    # PostgreSQL Database
    DATABASE_URL: str = (
        "postgresql+psycopg://aibot_user:aibot_local_secret_2026@postgres:5432/aibot_platform"
    )

    # Auth & Security
    SECRET_KEY: str = "insecure-default-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours
    IMPERSONATION_EXPIRE_MINUTES: int = 30  # short-lived impersonation token (M-02)
    # When false, access tokens are delivered ONLY via HttpOnly cookie and omitted from
    # JSON bodies, so XSS cannot read them (finding M-01). Recommended false in production.
    EXPOSE_TOKEN_IN_BODY: bool = True
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Vector DB (Qdrant)
    QDRANT_URL: str = "http://qdrant:6333"
    QDRANT_COLLECTION_NAME: str = "document_chunks"
    # API key sent to Qdrant. Empty = no auth (dev only). MUST be set in production.
    QDRANT_API_KEY: str = ""

    # LLM (OpenAI)
    OPENAI_API_KEY: str = "sk-replace-me"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHAT_MODEL: str = "gpt-4o"
    # When true, use deterministic mock embeddings/answers (local dev/tests ONLY).
    # When false, any OpenAI failure surfaces as a real error instead of fake data.
    USE_MOCK_AI: bool = False

    # File uploads
    MAX_UPLOAD_SIZE_MB: int = 20
    UPLOAD_DIR: str = "/app/uploads"
    # Max bytes read when fetching a remote URL for ingestion (SSRF/DoS guard).
    MAX_FETCH_BYTES: int = 5 * 1024 * 1024
    # Max PDF pages accepted (guards against decompression-bomb PDFs, finding M-06).
    MAX_PDF_PAGES: int = 500

    # Rate Limiting (Phase 5 Hardening)
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_WIDGET_PER_MINUTE: int = 60
    RATE_LIMIT_WIDGET_IP_PER_MINUTE: int = 20
    RATE_LIMIT_AUTH_PER_MINUTE: int = 15
    RATE_LIMIT_CHAT_PER_MINUTE: int = 30  # dashboard /chat per client IP
    # Shared Redis backing for rate limits/lockout (empty = per-process in-memory, dev only).
    REDIS_URL: str = ""
    # Number of trusted reverse proxies in front of the app. 0 = trust the socket IP
    # and IGNORE X-Forwarded-For (prevents header spoofing, finding H-03).
    TRUSTED_PROXY_HOPS: int = 0

    # Login brute-force protection (finding H-05)
    LOGIN_MAX_FAILURES: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15

    # Input caps & per-tenant quotas (finding H-04)
    MAX_FAQ_TEXT_CHARS: int = 100_000
    PLAN_MAX_DOCUMENTS: dict[str, int] = {"trial": 10, "starter": 50, "pro": 500}
    PLAN_MAX_MESSAGES_PER_MONTH: dict[str, int] = {
        "trial": 500,
        "starter": 5_000,
        "pro": 50_000,
    }

    # RBAC & Superadmin Closed Onboarding (Phase 6)
    SUPERADMIN_EMAIL: str = "admin@botforge.com"
    SUPERADMIN_PASSWORD: str = "Admin@BotForge2026!"

    @field_validator("DATABASE_URL")
    @classmethod
    def adjust_db_host_for_local_dev(cls, v: str) -> str:
        """Fallback to localhost if postgres container hostname is not resolvable locally."""
        if "@postgres:" in v:
            try:
                socket.gethostbyname("postgres")
            except socket.gaierror:
                return v.replace("@postgres:", "@localhost:")
        return v

    @field_validator("QDRANT_URL")
    @classmethod
    def adjust_qdrant_host_for_local_dev(cls, v: str) -> str:
        """Fallback to localhost if qdrant container hostname is not resolvable locally."""
        if "http://qdrant:" in v:
            try:
                socket.gethostbyname("qdrant")
            except socket.gaierror:
                return v.replace("http://qdrant:", "http://localhost:")
        return v

    @model_validator(mode="after")
    def _forbid_insecure_defaults_in_production(self) -> "Settings":
        """Refuse to boot in production with known default secrets (finding C-02)."""
        if self.ENVIRONMENT.lower() == "production":
            insecure = []
            if self.SECRET_KEY == _DEFAULT_SECRET_KEY:
                insecure.append("SECRET_KEY")
            if self.SUPERADMIN_PASSWORD == _DEFAULT_SUPERADMIN_PASSWORD:
                insecure.append("SUPERADMIN_PASSWORD")
            if insecure:
                raise ValueError(
                    "Refusing to start in production with insecure default value(s) for: "
                    f"{', '.join(insecure)}. Set strong values "
                    "(e.g. generate SECRET_KEY with `openssl rand -hex 64`)."
                )
        return self


settings = Settings()
