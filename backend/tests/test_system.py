import asyncio
import json
import logging
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.core.logging import JsonFormatter
from app.main import create_app
from app.schemas.system import SystemStatus
from app.services.system import get_system_status, probe_database


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "")
    monkeypatch.setenv("DIRECT_DATABASE_URL", "")
    get_settings.cache_clear()
    application = create_app()
    with TestClient(application, raise_server_exceptions=False) as test_client:
        yield test_client
    get_settings.cache_clear()


def test_health_without_database(client):
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/").json()["name"] == "HydroGig-Mesh API"


def test_status_without_database_never_probes(client):
    with patch("app.services.system.probe_database", new_callable=AsyncMock) as probe:
        response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    status = SystemStatus.model_validate(response.json())
    assert status.database.state == "not_configured"
    assert not status.database.configured
    assert not status.database.reachable
    assert status.flood_data == "unavailable"
    probe.assert_not_called()


@pytest.mark.parametrize("reachable,state", [(True, "reachable"), (False, "unreachable")])
def test_configured_database_status(reachable, state):
    settings = Settings(_env_file=None, database_url="postgresql://u:secret@example.test/db")
    with patch("app.services.system.probe_database", new_callable=AsyncMock) as probe:
        probe.return_value = reachable
        result = asyncio.run(get_system_status(settings))
    assert result.database.configured
    assert result.database.reachable is reachable
    assert result.database.state == state
    assert "secret" not in result.model_dump_json()


def test_failed_database_probe_is_safe():
    with patch("app.services.system.create_async_engine", side_effect=RuntimeError("secret URL")):
        assert asyncio.run(probe_database("postgresql://u:secret@localhost/db")) is False


def test_database_probe_has_deadline_and_disposes():
    engine = AsyncMock()

    class SlowConnection:
        async def __aenter__(self):
            await asyncio.sleep(10)

        async def __aexit__(self, *args):
            pass

    engine.connect = lambda: SlowConnection()
    original_timeout = asyncio.timeout
    with (
        patch("app.services.system.create_async_engine", return_value=engine),
        patch("app.services.system.asyncio.timeout", side_effect=lambda _: original_timeout(0.02)),
    ):
        assert asyncio.run(probe_database("postgresql://u:secret@localhost/db")) is False
    engine.dispose.assert_awaited_once()


def test_configuration():
    settings = Settings(_env_file=None, cors_origins="https://a.test, https://b.test ,")
    assert settings.allowed_origins == ["https://a.test", "https://b.test"]
    assert "secret" not in repr(
        Settings(_env_file=None, database_url="postgresql://u:secret@localhost/db")
    )
    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url="sqlite:///db")
    with pytest.raises(ValidationError):
        Settings(_env_file=None, app_env="typo")


def test_openapi_and_docs(client):
    assert client.get("/docs").status_code == 200
    schema = client.get("/openapi.json").json()
    assert "/api/v1/system/status" in schema["paths"]
    assert "/health" in schema["paths"]


def test_cors(client):
    response = client.options(
        "/api/v1/system/status",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    denied = client.options(
        "/api/v1/system/status",
        headers={
            "Origin": "https://untrusted.test",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-origin" not in denied.headers


def test_structured_logging():
    record = logging.LogRecord("hydrogig", logging.INFO, "", 0, "application_started", (), None)
    payload = json.loads(JsonFormatter().format(record))
    assert payload["event"] == "application_started"
    assert payload["level"] == "INFO"
