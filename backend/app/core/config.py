from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "VitessProbe"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development"
    DEBUG: bool = True
    DEMO_MODE: bool = True

    TSDB_URL: str = "postgresql://vitessprobe:vitessprobe_dev@localhost:5433/vitessprobe_metrics"
    NEON_DATABASE_URL: Optional[str] = None

    @property
    def active_db_url(self) -> str:
        return self.NEON_DATABASE_URL if self.NEON_DATABASE_URL else self.TSDB_URL

    VTGATE_HOST: str = "localhost"
    VTGATE_PORT: int = 15001
    ETCD_HOST: str = "localhost"
    ETCD_PORT: int = 2379
    PROMETHEUS_URL: str = "http://localhost:9090"

    SCATTER_QUERY_THRESHOLD: float = 0.3
    REPLICATION_LAG_THRESHOLD_S: int = 10
    QUERY_LATENCY_P99_THRESHOLD_MS: int = 500

    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://vitessprobe.vercel.app",
    ]

    class Config:
        env_file = "../.env"
        extra = "ignore"


settings = Settings()
