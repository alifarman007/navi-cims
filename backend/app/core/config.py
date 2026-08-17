from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment / backend/.env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "CIMS - Central Inventory Management System"
    ENV: str = "dev"  # dev | test | prod
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://cims:cims@localhost:5432/cims"
    TEST_DATABASE_URL: str = "postgresql+asyncpg://cims:cims@localhost:5432/cims_test"
    DB_ECHO: bool = False

    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_EXPIRE_HOURS: int = 12  # SRS: reset link valid at most 12 hours

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"  # comma-separated
    FRONTEND_URL: str = "http://localhost:5173"

    # Email (password reset). When SMTP_HOST is empty, mails are logged instead of sent.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "cims@navy.mil.bd"
    SMTP_TLS: bool = True

    # BNPIMS procurement integration. Empty base URL -> mock client.
    BNPIMS_BASE_URL: str = ""
    BNPIMS_API_KEY: str = ""
    BNPIMS_TIMEOUT_SECONDS: int = 20

    # Seed
    SEED_SUPERADMIN_USERNAME: str = "admin"
    SEED_SUPERADMIN_EMAIL: str = "admin@cims.local"
    SEED_SUPERADMIN_PHONE: str = "01700000000"
    SEED_SUPERADMIN_PASSWORD: str = "Admin@12345"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_prod(self) -> bool:
        return self.ENV == "prod"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
