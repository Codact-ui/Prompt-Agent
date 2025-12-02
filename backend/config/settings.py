"""Application settings and configuration."""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Google Cloud Configuration
    google_cloud_project: str = ""
    google_application_credentials: str = ""
    
    # Gemini API Key (alternative to Cloud credentials)
    gemini_api_key: str = ""
    
    # ADK Configuration
    adk_model: str = "gemini-2.0-flash-exp"
    adk_thinking_model: str = "gemini-2.0-flash-thinking-exp"
    
    # API Configuration
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str) and not v.strip().startswith("["):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    # Environment
    environment: str = "development"
    port: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# Singleton instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get or create settings singleton."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
