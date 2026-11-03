from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.core.config import Settings, get_settings
from app.schemas.system import SystemStatus
from app.services.system import get_system_status

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/status", response_model=SystemStatus)
async def system_status(
    response: Response, settings: Annotated[Settings, Depends(get_settings)]
) -> SystemStatus:
    response.headers["Cache-Control"] = "no-store"
    return await get_system_status(settings)
