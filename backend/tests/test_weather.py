import copy
import logging
from datetime import UTC, datetime

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.logging import WeatherAccessFilter
from app.main import create_app
from app.services.weather import OpenMeteoProvider, get_weather_provider


@pytest.fixture
def payload():
    return {
        "current": {
            "time": 1793761200,
            "interval": 900,
            "temperature_2m": 27.5,
            "relative_humidity_2m": 81,
            "precipitation": 1.2,
            "weather_code": 61,
            "wind_speed_10m": 8.4,
            "is_day": 1,
        },
        "current_units": {
            "time": "unixtime",
            "interval": "seconds",
            "temperature_2m": "°C",
            "relative_humidity_2m": "%",
            "precipitation": "mm",
            "weather_code": "wmo code",
            "wind_speed_10m": "km/h",
            "is_day": "",
        },
    }


def client_for(handler):
    app = create_app()
    app.dependency_overrides[get_weather_provider] = lambda: OpenMeteoProvider(
        httpx.MockTransport(handler)
    )
    return TestClient(app)


def test_current_weather_normalizes_time_units_provenance_without_database(payload):
    requests = []

    def upstream(request):
        requests.append(request)
        return httpx.Response(200, json=payload)

    with client_for(upstream) as client:
        response = client.get("/api/v1/weather/current?latitude=-6.60123&longitude=106.80123")
    assert response.status_code == 200
    data = response.json()
    assert data["temperature"] == 27.5
    assert data["humidity"] == 81
    assert data["precipitation"] == 1.2
    assert data["is_day"] is True
    assert data["provenance"] == "model_predicted"
    assert datetime.fromisoformat(data["model_time"]) == datetime.fromtimestamp(1793761200, UTC)
    assert datetime.fromisoformat(data["fetched_at"]).tzinfo is not None
    assert data["interval_seconds"] == 900
    assert data["units"]["wind_speed"] == "km/h"
    assert data["source_url"] == "https://open-meteo.com/"
    assert "CC BY 4.0" in data["attribution"]
    assert "no-store" in response.headers["cache-control"]
    assert "latitude" not in data
    assert requests[0].url.host == "api.open-meteo.com"
    assert requests[0].url.path == "/v1/forecast"
    assert requests[0].url.params["latitude"] == "-6.6"
    assert requests[0].url.params["longitude"] == "106.8"
    assert requests[0].url.params["timeformat"] == "unixtime"
    assert requests[0].url.params["timezone"] == "Asia/Jakarta"


@pytest.mark.parametrize(
    "query",
    [
        "latitude=91&longitude=0",
        "latitude=0&longitude=-181",
        "latitude=nan&longitude=0",
        "latitude=0&longitude=inf",
        "latitude=0",
        "latitude=no&longitude=0",
    ],
)
def test_coordinates_rejected_without_upstream(query):
    def unexpected(request):
        pytest.fail("Invalid coordinates must not reach provider")

    with client_for(unexpected) as client:
        assert client.get(f"/api/v1/weather/current?{query}").status_code == 422


@pytest.mark.parametrize("status", [302, 400, 429, 500, 503])
def test_provider_http_failures_are_safe(status):
    with client_for(
        lambda request: httpx.Response(status, text="private upstream detail")
    ) as client:
        response = client.get("/api/v1/weather/current?latitude=0&longitude=0")
    assert response.status_code == 503
    assert response.json() == {"detail": {"code": "weather_unavailable"}}


def test_provider_timeout_is_safe():
    def timeout(request):
        raise httpx.ReadTimeout("private upstream detail", request=request)

    with client_for(timeout) as client:
        response = client.get("/api/v1/weather/current?latitude=0&longitude=0")
    assert response.status_code == 503
    assert "private" not in response.text


@pytest.mark.parametrize(
    "change",
    [
        "missing_time",
        "invalid_units",
        "negative_rain",
        "bad_json",
        "bad_shape",
        "invalid_time",
        "no_values",
        "boolean_number",
    ],
)
def test_malformed_data_is_unavailable(payload, change):
    data = copy.deepcopy(payload)
    if change == "missing_time":
        del data["current"]["time"]
    elif change == "invalid_units":
        data["current_units"]["temperature_2m"] = "°F"
    elif change == "negative_rain":
        data["current"]["precipitation"] = -1
    elif change == "bad_shape":
        data = []
    elif change == "invalid_time":
        data["current"]["time"] = 10**30
    elif change == "no_values":
        data["current"] = {"time": 1793761200, "interval": 900}
    elif change == "boolean_number":
        data["current"]["temperature_2m"] = True
    with client_for(
        lambda request: (
            httpx.Response(200, text="invalid")
            if change == "bad_json"
            else httpx.Response(200, json=data)
        )
    ) as client:
        assert client.get("/api/v1/weather/current?latitude=0&longitude=0").status_code == 503


def test_partial_weather_never_invents_zeroes(payload):
    del payload["current"]["precipitation"]
    payload["current"]["temperature_2m"] = None
    with client_for(lambda request: httpx.Response(200, json=payload)) as client:
        data = client.get("/api/v1/weather/current?latitude=0&longitude=0").json()
    assert data["precipitation"] is None
    assert data["temperature"] is None
    assert data["humidity"] == 81


def test_access_logs_strip_weather_query():
    record = logging.LogRecord(
        "uvicorn.access",
        logging.INFO,
        "",
        0,
        '%s "%s %s HTTP/%s" %d',
        ("client", "GET", "/api/v1/weather/current?latitude=1&longitude=2", "1.1", 200),
        None,
    )
    WeatherAccessFilter().filter(record)
    assert "latitude" not in record.getMessage()
    assert "/api/v1/weather/current" in record.getMessage()
