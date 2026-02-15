"""
Database configuration for the example application.

Simple SQLite setup with table creation using async support.
"""

import asyncio
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from typing import AsyncGenerator

from persisted_object.sqlalchemy_models import mapper_registry

# SQLite database URLs
DATABASE_URL_ASYNC = "sqlite+aiosqlite:///./db/database.db"
DATABASE_URL_SYNC = "sqlite:///./db/database.db"

# --- Async setup (for FastAPI / uvicorn) ---
engine = create_async_engine(
    DATABASE_URL_ASYNC,
    echo=True  # Set to False in production
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# --- Sync setup (for scripts: seed, CLI tools) ---
sync_engine = create_engine(
    DATABASE_URL_SYNC,
    echo=True  # Set to False in production
)

SessionLocal = sessionmaker(
    bind=sync_engine,
    class_=Session,
    expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get async database session.
    
    Usage in FastAPI:
        @app.get("/api/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            # Use db here
            pass
    """
    async with AsyncSessionLocal() as session:
        yield session


def create_tables_sync() -> None:
    """
    Create all tables (sync version for scripts).
    """
    from . import models  # noqa: F401
    # Ensure the db directory exists
    Path("db").mkdir(parents=True, exist_ok=True)
    mapper_registry.metadata.create_all(sync_engine)


async def create_tables() -> None:
    """
    Create all tables in the database (async version for FastAPI).
    
    This should be called once when the application starts.
    In production, you'd use Alembic for migrations instead.
    """
    # Import models to ensure they're registered
    from . import models  # noqa: F401
    
    # Ensure the db directory exists
    Path("db").mkdir(parents=True, exist_ok=True)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(mapper_registry.metadata.create_all)


if __name__ == "__main__":
    create_tables_sync()
