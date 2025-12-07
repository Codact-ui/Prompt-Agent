"""Application settings and configuration."""
from pydantic_settings import BaseSettings
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
    
    # API Configuration - stored as string, parsed in get_settings()
    cors_origins: str = "http://localhost:5173,http://localhost,http://localhost:3000,http://localhost:80"
    
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
        
        # Parse CORS origins from string to list
        defaults = ["http://localhost:5173", "http://localhost", "http://localhost:3000", "http://localhost:80"]
        try:
            cors_str = _settings.cors_origins
            if cors_str:
                cors_str = cors_str.strip()
                # JSON array format
                if cors_str.startswith("[") and cors_str.endswith("]"):
                    import json
                    try:
                        parsed = json.loads(cors_str)
                        if isinstance(parsed, list):
                            _settings.cors_origins = [str(item).strip() for item in parsed if item] or defaults
                        else:
                            _settings.cors_origins = defaults
                    except (json.JSONDecodeError, ValueError, TypeError):
                        # Fall through to comma-separated parsing
                        origins = [origin.strip() for origin in cors_str.split(",") if origin.strip()]
                        _settings.cors_origins = origins if origins else defaults
                else:
                    # Comma-separated string
                    origins = [origin.strip() for origin in cors_str.split(",") if origin.strip()]
                    _settings.cors_origins = origins if origins else defaults
            else:
                _settings.cors_origins = defaults
        except Exception as e:
            import sys
            print(f"Warning: Error parsing CORS_ORIGINS: {e}, using defaults", file=sys.stderr)
            _settings.cors_origins = defaults
        
        # Auto-configure Google Gen AI environment variables for ADK
        if _settings.gemini_api_key:
            # Set the API key that ADK/GenAI SDK expects
            os.environ["GOOGLE_API_KEY"] = _settings.gemini_api_key
            # Force use of AI Studio (not Vertex AI) when using API key
            os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"
            
    return _settings
