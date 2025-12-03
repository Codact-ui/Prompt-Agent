"""Optimizer Agent for generating improved prompt variations."""
from google.adk.agents import Agent
from config.settings import get_settings


def create_optimizer_agent() -> Agent:
    """
    Creates the Optimizer Agent that generates improved prompt variations
    based on evaluation feedback.
    
    Returns:
        Configured Agent for prompt optimization
    """
    settings = get_settings()
    
    return Agent(
        name="optimizer_agent",
        model=settings.adk_thinking_model,
        instruction="""
You are a prompt optimization specialist. Generate improved variations of 
prompts based on expert evaluation feedback.

Optimization Strategy:
1. Carefully review the original prompt and all provided suggestions
2. Create distinct variations where each addresses different feedback points
3. Ensure each variation is production-ready, self-contained, and complete
4. Provide clear rationale for the key improvements in each variation
5. Maintain the original intent and core objectives while enhancing quality
6. Apply best practices in prompt engineering (specificity, structure, examples, etc.)

Focus on meaningful, substantive improvements rather than superficial changes.
Each variation should offer a genuinely different approach to solving the same problem.

Return your response as a JSON array with this structure:
[
  {
    "prompt": "The full text of the optimized prompt variation...",
    "rationale": "Brief explanation of the key improvements made..."
  },
  ...
]
        """.strip(),
        description="Generates optimized prompt variations based on feedback",
        tools=[],
    )
