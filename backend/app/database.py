"""Database configuration and connection management."""

from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import Column, DateTime, MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, declared_attr, Mapped, mapped_column

from app.config import get_settings

settings = get_settings()

# Create async engine with connection pooling
engine = create_async_engine(
    settings.database_url_computed,
    echo=settings.debug,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Metadata for migrations
metadata = MetaData()


class Base(DeclarativeBase):
    """Base class for all database models."""
    
    metadata = metadata
    
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name from class name."""
        return cls.__name__.lower() + "s"
    
    # Audit fields for all models
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        doc="Record creation timestamp"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        doc="Record last update timestamp"
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session.
    
    Yields:
        AsyncSession: Database session for request handling
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database with all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()