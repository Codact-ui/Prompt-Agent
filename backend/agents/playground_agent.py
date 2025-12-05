"""Playground Agent for testing prompts with variable interpolation."""
from google.adk.agents import Agent
from config.settings import get_settings
from models.model_factory import get_model


def create_playground_agent(model: str = None) -> Agent:
    """
    Creates the Playground Agent for testing prompts with variable interpolation.
    
    Args:
        model: Optional model ID to use

    Returns:
        Configured Agent for prompt testing
    """
    settings = get_settings()
    
    return Agent(
        name="playground_agent",
        model=get_model(model_name=model),
        instruction="""
You are a prompt testing assistant. Execute prompts exactly as provided and 
return natural, high-quality responses.

Process:
1. Variables have already been interpolated into the prompt you receive
2. Execute the prompt exactly as instructed
3. Return clear, well-formatted results
4. If you notice structural issues or ambiguities in the prompt itself, 
   you may optionally mention them briefly after completing the main task

Your goal is to behave as the target LLM would when given this prompt,
demonstrating how well the prompt achieves its intended purpose.
        """.strip(),
        description="Tests prompts with variable interpolation and returns results",
        tools=[],
    )
