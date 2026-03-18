"""
app/db/session.py
Environment-aware database engine creation.
- SQLite  → development / testing
- PostgreSQL → production
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config.settings import get_settings

settings = get_settings()


def _build_engine():
    """Create the correct SQLAlchemy engine based on DATABASE_URL."""
    url = settings.DATABASE_URL

    if settings.is_sqlite:
        engine = create_engine(
            url,
            connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI
            echo=(settings.ENVIRONMENT == "development"),
        )

        # Enable WAL mode for better concurrent read performance in SQLite
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_conn, _):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        return engine

    # PostgreSQL / production
    engine = create_engine(
        url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=(settings.ENVIRONMENT == "development"),
    )
    return engine


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
