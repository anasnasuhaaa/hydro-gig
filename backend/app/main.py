import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.endpoints.system import router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.schemas.system import Health, RootInfo


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging(get_settings().log_level)
    logging.getLogger("hydrogig").info("application_started")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(title="HydroGig-Mesh API", version="0.1.0", lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET"],
        allow_headers=["Accept", "Content-Type"],
    )
    application.include_router(router, prefix="/api/v1")

    @application.get("/", response_model=RootInfo, tags=["system"])
    def root() -> RootInfo:
        return RootInfo()

    @application.get("/health", response_model=Health, tags=["system"])
    def health() -> Health:
        return Health()

    @application.exception_handler(Exception)
    async def internal_error(request: Request, exc: Exception) -> JSONResponse:
        logging.getLogger("hydrogig").error("unhandled_request_error")
        return JSONResponse(status_code=500, content={"detail": "An internal error occurred"})

    return application


app = create_app()
