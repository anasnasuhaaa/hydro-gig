import json
import logging
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        # Never serialize exception strings or arbitrary request/connection data.
        return json.dumps(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "event": record.getMessage(),
            }
        )


class WeatherAccessFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # Uvicorn logs the request target including its query by default.
        if isinstance(record.args, tuple) and len(record.args) >= 3:
            target = record.args[2]
            if isinstance(target, str) and target.split("?", 1)[0] == "/api/v1/weather/current":
                args = list(record.args)
                args[2] = target.split("?", 1)[0]
                record.args = tuple(args)
        return True


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logger = logging.getLogger("hydrogig")
    logger.handlers = [handler]
    logger.setLevel(level)
    logger.propagate = False

    access_logger = logging.getLogger("uvicorn.access")
    if not any(isinstance(item, WeatherAccessFilter) for item in access_logger.filters):
        access_logger.addFilter(WeatherAccessFilter())
    # HTTPX INFO logs include upstream URLs; never emit weather coordinates.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
