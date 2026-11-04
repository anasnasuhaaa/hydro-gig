import asyncio
from datetime import UTC, datetime
from typing import Annotated, Literal

import httpx
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.schemas.weather import CurrentWeather

UPSTREAM_URL = "https://api.open-meteo.com/v1/forecast"
CURRENT_VARIABLES = (
    "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day"
)
Number = Annotated[float, Field(strict=True, allow_inf_nan=False)]


class WeatherUnavailable(Exception):
    """Safe provider failure; do not attach upstream bodies, URLs or coordinates."""


class ProviderCurrent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    time: Annotated[int, Field(strict=True)]
    interval: Annotated[int, Field(strict=True, gt=0)]
    temperature_2m: Number | None = None
    relative_humidity_2m: Annotated[Number, Field(ge=0, le=100)] | None = None
    precipitation: Annotated[Number, Field(ge=0)] | None = None
    wind_speed_10m: Annotated[Number, Field(ge=0)] | None = None
    weather_code: Annotated[int, Field(strict=True, ge=0)] | None = None
    is_day: Literal[0, 1] | None = None


class OpenMeteoProvider:
    def __init__(self, transport: httpx.AsyncBaseTransport | None = None):
        self.transport = transport

    async def current(self, latitude: float, longitude: float) -> CurrentWeather:
        try:
            async with (
                asyncio.timeout(7),
                httpx.AsyncClient(
                    transport=self.transport,
                    timeout=httpx.Timeout(5, connect=2),
                    follow_redirects=False,
                    trust_env=False,
                ) as client,
            ):
                response = await client.get(
                    UPSTREAM_URL,
                    params={
                        "latitude": round(latitude, 2),
                        "longitude": round(longitude, 2),
                        "current": CURRENT_VARIABLES,
                        "timezone": "Asia/Jakarta",
                        "timeformat": "unixtime",
                        "temperature_unit": "celsius",
                        "wind_speed_unit": "kmh",
                        "precipitation_unit": "mm",
                        "forecast_days": 1,
                    },
                )
                response.raise_for_status()
                payload = response.json()
            current = ProviderCurrent.model_validate(payload["current"])
            units = payload["current_units"]
            expected = {
                "time": "unixtime",
                "interval": "seconds",
                "temperature_2m": "°C",
                "relative_humidity_2m": "%",
                "precipitation": "mm",
                "wind_speed_10m": "km/h",
                "weather_code": "wmo code",
                "is_day": "",
            }
            # Optional values remain null; supplied numbers require verified units.
            for key, unit in expected.items():
                if getattr(current, key) is not None and units.get(key) != unit:
                    raise WeatherUnavailable()
            if all(
                getattr(current, key) is None for key in expected if key not in {"time", "interval"}
            ):
                raise WeatherUnavailable()
            return CurrentWeather(
                model_time=datetime.fromtimestamp(current.time, UTC),
                fetched_at=datetime.now(UTC),
                interval_seconds=current.interval,
                temperature=current.temperature_2m,
                humidity=current.relative_humidity_2m,
                precipitation=current.precipitation,
                wind_speed=current.wind_speed_10m,
                weather_code=current.weather_code,
                is_day=None if current.is_day is None else bool(current.is_day),
            )
        except (
            httpx.HTTPError,
            TimeoutError,
            ValidationError,
            ValueError,
            KeyError,
            TypeError,
            AttributeError,
            OverflowError,
        ):
            raise WeatherUnavailable() from None


def get_weather_provider() -> OpenMeteoProvider:
    return OpenMeteoProvider()
