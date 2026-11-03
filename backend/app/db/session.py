from sqlalchemy import create_engine
from sqlalchemy.engine import URL, Engine, make_url
from sqlalchemy.pool import NullPool


def psycopg_url(raw: str) -> URL:
    return make_url(raw).set(drivername="postgresql+psycopg")


def create_database_engine(raw: str) -> Engine:
    # Constructed only when requested; no network connection during import.
    # NullPool avoids persistent connections in serverless runtimes / Neon poolers.
    return create_engine(
        psycopg_url(raw),
        poolclass=NullPool,
        connect_args={"connect_timeout": 3, "options": "-c statement_timeout=2000"},
        hide_parameters=True,
    )
