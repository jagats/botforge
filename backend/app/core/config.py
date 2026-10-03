"""Application configuration via pydantic-settings."""

import socket
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # Vector DB (Qdrant)
    QDRANT_URL: str = "http://qdrant:6333"
    QDRANT_COLLECTION_NAME: str = "document_chunks"

    # LLM (OpenAI)
    OPENAI_API_KEY: str = "sk-replace-me"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHAT_MODEL: str = "gpt-4o"

    # File uploads
    MAX_UPLOAD_SIZE_MB: int = 20
    UPLOAD_DIR: str = "/app/uploads"

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


settings = Settings()
