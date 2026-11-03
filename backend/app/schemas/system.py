from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class Health(BaseModel):
    status: Literal["ok"] = "ok"


class RootInfo(BaseModel):
    name: str = "HydroGig-Mesh API"
    version: str = "0.1.0"
    docs: str = "/docs"


class DatabaseStatus(BaseModel):
    configured: bool
    reachable: bool
    state: Literal["not_configured", "reachable", "unreachable"]


class SystemStatus(BaseModel):
    application: Literal["operational"] = "operational"
    phase: Literal["foundation"] = "foundation"
    checked_at: datetime
    database: DatabaseStatus
    flood_data: Literal["unavailable"] = "unavailable"
