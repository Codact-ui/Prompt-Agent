"""Model factory for selecting between Gemini and LiteLLM providers."""
from typing import Union
from google.adk.models.lite_llm import LiteLlm
from config.settings import get_settings


def get_model(use_thinking_model: bool = False, model_name: Union[str, None] = None) -> Union[str, LiteLlm]:
    """
    Return the appropriate model based on settings or override.
    
    Args:
        use_thinking_model: If True, use the thinking model variant (for complex reasoning tasks)
        model_name: Optional override for the model ID (e.g. "ollama/llama3")
        
    Returns:
        Either a model string (for Gemini) or a LiteLlm instance (for local models)
    """
    settings = get_settings()
    
    # If a specific model is requested, use it
    if model_name:
        # Check if it's an Ollama/LiteLLM model (heuristic: contains '/')
        if "/" in model_name or model_name.startswith("ollama"):
             return LiteLlm(
                model=model_name,
                api_base=settings.litellm_api_base
            )
        else:
            # Assume it's a Gemini model ID
            return model_name
    
    if settings.model_provider == "litellm":
        # Use LiteLLM for local models (e.g., Ollama)
        return LiteLlm(
            model=settings.litellm_model,
            api_base=settings.litellm_api_base
        )
    else:
        # Default: Use Gemini models
        if use_thinking_model:
            return settings.adk_thinking_model
        return settings.adk_model


def get_model_name() -> str:
    """
    Get a human-readable name for the current model configuration.
    Useful for logging and display purposes.
    """
    settings = get_settings()
    
    if settings.model_provider == "litellm":
        return f"LiteLLM ({settings.litellm_model})"
    else:
        return f"Gemini ({settings.adk_model})"
