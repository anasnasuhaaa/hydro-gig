from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.schemas.weather import CurrentWeather
from app.services.weather import OpenMeteoProvider, WeatherUnavailable, get_weather_provider

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=CurrentWeather)
async def current_weather(
    response: Response,
    latitude: Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)],
    longitude: Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)],
    provider: Annotated[OpenMeteoProvider, Depends(get_weather_provider)],
) -> CurrentWeather:
    response.headers["Cache-Control"] = "no-store"
    try:
        return await provider.current(latitude, longitude)
    except WeatherUnavailable:
        raise HTTPException(
            status_code=503,
            detail={"code": "weather_unavailable"},
            headers={"Cache-Control": "no-store"},
        ) from None
