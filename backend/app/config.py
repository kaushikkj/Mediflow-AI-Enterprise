from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    database_url: str = (
        "postgresql+psycopg://"
        "mediflow:mediflow@"
        "postgres:5432/mediflow"
    )

    jwt_secret: str = (
        "change-this-local-secret"
    )
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    jwt_issuer: str = "mediflow-api"
    jwt_audience: str = "mediflow-web"

    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "mediflow"
    minio_secret_key: str = (
        "mediflow123"
    )
    minio_bucket: str = (
        "medical-documents"
    )

    redis_url: str = (
        "redis://redis:6379/0"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()