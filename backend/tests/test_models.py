from geoalchemy2 import Geometry
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from app.db.base import Base
from app.db.session import psycopg_url
from app.models import entities  # noqa: F401


def test_offline_migration_contains_spatial_indexes(monkeypatch):
    from io import StringIO

    from alembic.config import Config

    from alembic import command
    from app.core.config import get_settings

    # Offline SQL compilation only: this URL is not contacted.
    monkeypatch.setenv("DATABASE_URL", "postgresql://offline:offline@localhost/offline")
    monkeypatch.setenv("DIRECT_DATABASE_URL", "")
    get_settings.cache_clear()
    output = StringIO()
    config = Config("alembic.ini", output_buffer=output)
    try:
        command.upgrade(config, "head", sql=True)
    finally:
        get_settings.cache_clear()
    sql = output.getvalue()
    assert sql.count("CREATE TABLE ") == 7  # Six domain tables plus alembic_version.
    assert sql.count("USING gist") == 4
    assert "geometry(LINESTRING,4326)" in sql
    assert "geometry(POINT,4326)" in sql
    assert "derived_requires_scenario" in sql


def test_six_models_compile_for_postgres():
    assert set(Base.metadata.tables) == {
        "drivers",
        "road_segments",
        "flood_scenarios",
        "flood_observations",
        "trips",
        "claims",
    }
    for table in Base.metadata.sorted_tables:
        ddl = str(CreateTable(table).compile(dialect=postgresql.dialect()))
        assert "UUID" in ddl
        assert "TIMESTAMP WITH TIME ZONE" in ddl
        for column in table.columns:
            if isinstance(column.type, Geometry):
                assert column.type.srid == 4326


def test_neon_url_preserves_ssl():
    url = psycopg_url("postgresql://u:pass@db.example/db?sslmode=require")
    assert url.drivername == "postgresql+psycopg"
    assert url.query["sslmode"] == "require"
