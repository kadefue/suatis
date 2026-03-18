"""
app/config/settings.py
Centralised configuration with Pydantic Settings.
Automatically switches between SQLite (dev) and PostgreSQL (prod)
based on the DATABASE_URL environment variable.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────────────────────
    APP_NAME: str = "TGS – Sokoine University of Agriculture"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"  # development | production

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "changeme-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Database ─────────────────────────────────────────────────────────────
    # Override with DATABASE_URL=postgresql://... for production
    DATABASE_URL: str = "sqlite:///./tgs_dev.db"

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Timetable defaults (overridable via /api/v1/settings) ────────────────
    DEFAULT_LECTURER_START: str = "07:00"
    DEFAULT_LECTURER_END: str = "19:30"
    DEFAULT_FRIDAY_PRAYER_START: str = "12:15"
    DEFAULT_FRIDAY_PRAYER_END: str = "14:00"
    DEFAULT_SLOT_DURATION_MINUTES: int = 45

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def is_postgres(self) -> bool:
        return self.DATABASE_URL.startswith("postgresql") or self.DATABASE_URL.startswith("postgres")


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
