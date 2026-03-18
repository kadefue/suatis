"""
main.py — TGS FastAPI Application Entry Point
Sokoine University of Agriculture
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.db.session import engine, Base
from app.api.v1.router import api_router

# ── Import all models so Alembic / create_all can discover them ──────────────
from app.models import models  # noqa: F401

settings = get_settings()
log = logging.getLogger("tgs")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup (dev mode). Use Alembic in production."""
    if settings.ENVIRONMENT == "development":
        Base.metadata.create_all(bind=engine)
        log.info("✅  Database tables created/verified (dev mode)")
        _seed_defaults()
    yield
    log.info("TGS shutdown complete.")


def _seed_defaults():
    """Seed roles and system settings if they don't exist."""
    from sqlalchemy.orm import Session
    from app.models.models import Role, SystemSetting

    with Session(engine) as db:
        # Roles
        for role_name in ["Admin", "Department Head", "Instructor", "Student"]:
            if not db.query(Role).filter(Role.name == role_name).first():
                db.add(Role(name=role_name))

        # Default system settings
        defaults = {
            "lecturer_available_start_time": "07:00",
            "lecturer_available_end_time": "19:30",
            "friday_prayer_start": "12:15",
            "friday_prayer_end": "14:00",
            "slot_duration_minutes": "45",
            "current_academic_year": "2024/2025",
            "current_semester": "1",
        }
        for key, value in defaults.items():
            if not db.query(SystemSetting).filter(SystemSetting.key == key).first():
                db.add(SystemSetting(key=key, value=value))

        db.commit()
        log.info("✅  Default roles and settings seeded")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Timetable Generation System for Sokoine University of Agriculture",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(api_router)


@app.get("/", tags=["Health"])
def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "db": "SQLite" if settings.is_sqlite else "PostgreSQL",
    }
