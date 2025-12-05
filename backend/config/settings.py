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
    adk_model: str = "gemini-2.5-flash"
    adk_thinking_model: str = "gemini-2.5-flash"
    
    # Model Provider Configuration
    model_provider: str = "gemini"  # "gemini" or "litellm"
    litellm_model: str = "ollama/kimi-k2-thinking:cloud"  # Model ID for LiteLLM (e.g., "ollama/llama3.2")
    litellm_api_base: str = "http://localhost:11501"  # Ollama default API base
    
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
        # Load .env from the backend directory (parent of config directory)
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        case_sensitive = False
        extra = "ignore"


# Singleton instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get or create settings singleton."""
    global _settings
    if _settings is None:
        _settings = Settings()
        
        # Auto-configure Google Gen AI environment variables for ADK
        if _settings.gemini_api_key:
            # Set the API key that ADK/GenAI SDK expects
            os.environ["GOOGLE_API_KEY"] = _settings.gemini_api_key
            # Force use of AI Studio (not Vertex AI) when using API key
            os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"
            
    return _settings
