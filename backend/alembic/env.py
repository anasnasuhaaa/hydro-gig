from sqlalchemy import pool

from alembic import context
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import create_database_engine, psycopg_url
from app.models import entities  # noqa: F401

settings = get_settings()
raw_url = (
    settings.direct_database_url.get_secret_value() or settings.database_url.get_secret_value()
)
if not raw_url:
    raise RuntimeError("Set DIRECT_DATABASE_URL or DATABASE_URL before running migrations")

target_metadata = Base.metadata

if context.is_offline_mode():
    context.configure(
        url=psycopg_url(raw_url),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()
else:
    engine = create_database_engine(raw_url)
    assert isinstance(engine.pool, pool.NullPool)
    try:
        with engine.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata)
            with context.begin_transaction():
                context.run_migrations()
    finally:
        engine.dispose()
