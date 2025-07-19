"""Application configuration management."""

import os
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    app_name: str = "Owleyes"
    debug: bool = False
    version: str = "0.1.0"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database
    database_url: Optional[str] = None
    database_host: str = "localhost"
    database_port: int = 5432
    database_user: str = "postgres"
    database_password: str = "postgres"
    database_name: str = "owleyes"
    
    # Security
    secret_key: str = "change-this-in-production"
    access_token_expire_minutes: int = 30
    
    # SSH
    ssh_timeout: int = 30
    ssh_connection_pool_size: int = 10
    
    # Logging
    log_level: str = "INFO"
    
    @property
    def database_url_computed(self) -> str:
        """Compute database URL if not explicitly provided."""
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+asyncpg://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


# Environment-specific configurations
class DevelopmentSettings(Settings):
    """Development environment settings."""
    debug: bool = True
    log_level: str = "DEBUG"


class ProductionSettings(Settings):
    """Production environment settings."""
    debug: bool = False
    log_level: str = "WARNING"


def get_environment_settings() -> Settings:
    """Get settings based on environment."""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    return DevelopmentSettings()