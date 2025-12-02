"""Playground Agent for testing prompts with variable interpolation."""
from google.adk.agents import Agent
from config.settings import get_settings


def create_playground_agent() -> Agent:
    """
    Creates the Playground Agent for testing prompts with variable interpolation.
    
    Returns:
        Configured Agent for prompt testing
    """
    settings = get_settings()
    
    return Agent(
        name="playground_agent",
        model=settings.adk_model,
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
