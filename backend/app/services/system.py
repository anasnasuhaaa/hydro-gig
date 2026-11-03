import asyncio
import logging
from datetime import UTC, datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings
from app.db.session import psycopg_url
from app.schemas.system import DatabaseStatus, SystemStatus

logger = logging.getLogger("hydrogig.system")


async def probe_database(raw_url: str) -> bool:
    engine = None
    try:
        async with asyncio.timeout(4):
            engine = create_async_engine(
                psycopg_url(raw_url),
                poolclass=NullPool,
                connect_args={"connect_timeout": 3, "options": "-c statement_timeout=2000"},
                hide_parameters=True,
            )
            async with engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
            return True
    except Exception:
        logger.warning("database_probe_failed")
        return False
    finally:
        if engine is not None:
            await engine.dispose()


async def get_system_status(settings: Settings) -> SystemStatus:
    raw_url = settings.database_url.get_secret_value()
    reachable = await probe_database(raw_url) if raw_url else False
    state = "reachable" if reachable else "unreachable" if raw_url else "not_configured"
    return SystemStatus(
        checked_at=datetime.now(UTC),
        database=DatabaseStatus(configured=bool(raw_url), reachable=reachable, state=state),
    )
