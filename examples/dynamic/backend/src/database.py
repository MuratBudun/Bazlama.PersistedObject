"""
Database configuration for the dynamic example application.
"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from typing import AsyncGenerator

from persisted_object.sqlalchemy_models import mapper_registry

# SQLite database URLs
DATABASE_URL_ASYNC = "sqlite+aiosqlite:///./db/database.db"
DATABASE_URL_SYNC = "sqlite:///./db/database.db"

# --- Async setup ---
engine = create_async_engine(
    DATABASE_URL_ASYNC,
    echo=False
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# --- Sync setup ---
sync_engine = create_engine(
    DATABASE_URL_SYNC,
    echo=False
)

SessionLocal = sessionmaker(
    bind=sync_engine,
    class_=Session,
    expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get async database session."""
    async with AsyncSessionLocal() as session:
        yield session


def create_tables_sync() -> None:
    """Create all tables (sync version for scripts)."""
    from . import models  # noqa: F401
    Path("db").mkdir(parents=True, exist_ok=True)
    mapper_registry.metadata.create_all(sync_engine)


async def create_tables() -> None:
    """Create all tables in the database (async version for FastAPI)."""
    from . import models  # noqa: F401
    Path("db").mkdir(parents=True, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(mapper_registry.metadata.create_all)
