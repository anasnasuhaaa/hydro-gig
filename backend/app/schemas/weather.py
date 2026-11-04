from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class WeatherUnits(BaseModel):
    temperature: Literal["°C"] = "°C"
    humidity: Literal["%"] = "%"
    precipitation: Literal["mm"] = "mm"
    wind_speed: Literal["km/h"] = "km/h"


class CurrentWeather(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)

    provider: Literal["open-meteo"] = "open-meteo"
    provenance: Literal["model_predicted"] = "model_predicted"
    model_time: datetime
    fetched_at: datetime
    timezone: Literal["Asia/Jakarta"] = "Asia/Jakarta"
    interval_seconds: int = Field(gt=0)
    temperature: float | None
    humidity: float | None = Field(ge=0, le=100)
    precipitation: float | None = Field(ge=0)
    wind_speed: float | None = Field(ge=0)
    weather_code: int | None
    is_day: bool | None
    units: WeatherUnits = WeatherUnits()
    attribution: Literal["Weather data by Open-Meteo (CC BY 4.0)"] = (
        "Weather data by Open-Meteo (CC BY 4.0)"
    )
    source_url: Literal["https://open-meteo.com/"] = "https://open-meteo.com/"
