from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", hide_input_in_errors=True)

    app_env: Literal["development", "test", "production"] = "development"
    database_url: SecretStr = SecretStr("")
    direct_database_url: SecretStr = SecretStr("")
    cors_origins: str = "http://localhost:3000"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    @field_validator("cors_origins")
    @classmethod
    def explicit_cors_origins(cls, value: str) -> str:
        for origin in value.split(","):
            if not origin.strip():
                continue
            parsed = urlsplit(origin.strip())
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.hostname
                or "*" in origin
                or parsed.username is not None
                or parsed.password is not None
                or parsed.path
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError(
                    "CORS requires explicit HTTP(S) origins without paths or wildcards"
                )
        return value

    @field_validator("database_url", "direct_database_url")
    @classmethod
    def validate_database_url(cls, value: SecretStr) -> SecretStr:
        raw = value.get_secret_value()
        if raw:
            try:
                url = make_url(raw)
                if url.drivername not in {"postgres", "postgresql", "postgresql+psycopg"}:
                    raise ValueError
                if not url.host or not url.database:
                    raise ValueError
            except Exception:
                raise ValueError("A PostgreSQL URL with a host and database is required") from None
        return value

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
