from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.schemas.experimental import Frame, Network, Scenarios, ScreenRequest, ScreenResponse
from app.services import experimental as service

router = APIRouter(prefix="/experimental", tags=["experimental-unverified-fixture"])


def invoke(function, *args):
    try:
        return function(*args)
    except LookupError:
        raise HTTPException(404, "Unknown experimental scenario or frame") from None
    except (OSError, ValidationError):
        raise HTTPException(503, "Experimental fixture unavailable") from None
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from None


@router.get("/network", response_model=Network)
def network():
    return invoke(service.network)


@router.get("/scenarios", response_model=Scenarios)
def scenarios():
    return invoke(service.scenarios)


@router.get("/scenarios/{scenario_id}/frames/{step}", response_model=Frame)
def frame(scenario_id: str, step: str):
    return invoke(service.frame, scenario_id, step)


@router.post("/routes/screen", response_model=ScreenResponse)
def screen(request: ScreenRequest):
    return invoke(service.screen, request)
