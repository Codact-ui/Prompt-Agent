"""Service for managing and fetching available LLM models."""
import httpx
from typing import List, Dict, Any
from config.settings import get_settings

async def get_ollama_models() -> List[Dict[str, Any]]:
    """
    Fetch available models from the local Ollama instance.
    
    Returns:
        List of model dictionaries with 'id' and 'name'.
    """
    settings = get_settings()
    base_url = settings.litellm_api_base
    
    # Ollama API endpoint for tags (list models)
    # Usually http://localhost:11434/api/tags
    # We need to handle if base_url has /v1 or not, but typically for Ollama direct access
    # it's just the base URL. If litellm_api_base is pointing to a specific port, we assume
    # it's the Ollama server root.
    
    try:
        async with httpx.AsyncClient() as client:
            # Try standard Ollama tags endpoint
            # Remove trailing slash if present
            clean_base = base_url.rstrip('/')
            response = await client.get(f"{clean_base}/api/tags", timeout=5.0)
            
            if response.status_code == 200:
                data = response.json()
                models = []
                for model in data.get('models', []):
                    model_name = model.get('name')
                    if model_name:
                        models.append({
                            "id": f"ollama/{model_name}",
                            "name": model_name,
                            "provider": "ollama"
                        })
                return models
    except Exception as e:
        print(f"Error fetching Ollama models: {e}")
        return []
    
    return []

async def get_available_models() -> List[Dict[str, Any]]:
    """
    Get all available models from configured providers.
    
    Returns:
        List of available models.
    """
    settings = get_settings()
    models = []
    
    # Always add the default Gemini models
    models.append({
        "id": settings.adk_model,
        "name": f"Gemini (Default: {settings.adk_model})",
        "provider": "google"
    })
    
    # If configured for LiteLLM/Ollama, fetch local models
    if settings.model_provider == "litellm":
        ollama_models = await get_ollama_models()
        models.extend(ollama_models)
        
        # Add the configured default if not found (fallback)
        default_local = settings.litellm_model
        if not any(m['id'] == default_local for m in models) and not any(m['id'] == f"ollama/{default_local}" for m in models):
             models.append({
                "id": default_local,
                "name": f"Configured Default ({default_local})",
                "provider": "litellm"
            })
            
    return models
