from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.demo import (
    DemoFrame,
    DemoManifest,
    DemoNetwork,
    DemoScenarios,
    ScreenRequest,
    ScreenResponse,
)
from app.services.demo import DemoService
from app.services.routing import DijkstraEngine, FixtureWeighting
from demo.provider import SyntheticProvider

router = APIRouter(prefix="/demo", tags=["experimental-simulated-demo"])


def demo_service() -> DemoService:
    return DemoService(SyntheticProvider(), DijkstraEngine(), FixtureWeighting())


Service = Annotated[DemoService, Depends(demo_service)]


@router.get("/manifest", response_model=DemoManifest)
def manifest(service: Service) -> DemoManifest:
    return service.provider.manifest()


@router.get("/network", response_model=DemoNetwork)
def network(service: Service) -> DemoNetwork:
    return DemoNetwork(network=service.provider.network())


@router.get("/scenarios", response_model=DemoScenarios)
def scenarios(service: Service) -> DemoScenarios:
    return DemoScenarios(scenarios=service.provider.scenarios())


@router.get("/scenarios/{scenario_id}/frames/{step}", response_model=DemoFrame)
def frame(scenario_id: str, step: str, service: Service) -> DemoFrame:
    try:
        return service.provider.frame(scenario_id, step)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from None


@router.post("/screen", response_model=ScreenResponse)
def screen(request: ScreenRequest, service: Service) -> ScreenResponse:
    try:
        return service.screen(request)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None
