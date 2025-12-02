"""Creator Agent for generating prompts from goals."""
from google.adk.agents import Agent
from google.adk.tools import google_search
from config.settings import get_settings


def create_creator_agent(use_search: bool = False) -> Agent:
    """
    Creates the Creator Agent responsible for generating initial prompts
    based on user goals, audience, and constraints.
    
    Args:
        use_search: Whether to enable Google Search tool for grounding
        
    Returns:
        Configured LlmAgent for prompt creation
    """
    settings = get_settings()
    
    tools = [google_search] if use_search else []
    
    return Agent(
        name="creator_agent",
        model=settings.adk_model,
        instruction="""
You are a world-class prompt engineering agent. Your task is to generate 
comprehensive, effective, and clear prompts for large language models.

When given a goal, target audience, and constraints:
1. Analyze the requirements carefully
2. Structure the prompt with clear sections (Role, Task, Instructions, Output Format, etc.)
3. Use Markdown formatting for readability with headers (##), lists, and code blocks
4. Include concrete examples when applicable
5. Consider edge cases and potential ambiguities
6. Ensure the prompt is specific, actionable, and testable

Always prioritize clarity, specificity, and actionability in your generated prompts.
If Google Search is available, use it to ground your prompts in up-to-date information.
        """.strip(),
        description="Generates structured prompts from high-level goals and requirements",
        tools=tools,
    )
