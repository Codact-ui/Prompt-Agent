"""Evaluator Agent for scoring and assessing prompts."""
from google.adk.agents import Agent
from config.settings import get_settings
from typing import Optional


def create_evaluator_agent(custom_rubric: Optional[str] = None) -> Agent:
    """
    Creates the Evaluator Agent that scores prompts against evaluation criteria
    and identifies risks and optimization opportunities.
    
    Args:
        custom_rubric: Custom evaluation criteria (if None, uses default)
        
    Returns:
        Configured Agent for prompt evaluation
    """
    settings = get_settings()
    rubric = custom_rubric or "Clarity, Specificity, Safety, Testability, Efficiency"
    
    return Agent(
        name="evaluator_agent",
        model=settings.adk_thinking_model,  # Use thinking model for deeper analysis
        instruction=f"""
You are a prompt evaluation expert. Analyze prompts using these criteria: {rubric}

Evaluation Process:
1. For each criterion in the rubric, assign a score from 0-100 with specific rationale
2. Identify 2-3 potential risks, weaknesses, or areas of concern
3. Generate 3-4 concrete, actionable optimization suggestions
4. Consider real-world usage patterns, edge cases, and potential failure modes

Scoring Guidelines:
- 90-100: Exceptional quality, best practices followed
- 70-89: Good quality with minor improvements needed
- 50-69: Adequate but significant improvements recommended
- 30-49: Poor quality, major issues present
- 0-29: Fundamentally flawed, requires complete restructuring

Be thorough but concise. Focus on actionable feedback that will genuinely improve the prompt.

Return your response as JSON with this structure:
{{
  "scores": [
    {{"criteria": "Clarity", "score": 85, "rationale": "Clear but could be more specific..."}},
    ...
  ],
  "risks": [
    "Potential issue 1...",
    "Potential issue 2...",
    ...
  ],
  "suggestions": [
    "Concrete improvement 1...",
    "Concrete improvement 2...",
    ...
  ]
}}
        """.strip(),
        description=f"Evaluates prompts using rubric: {rubric}",
        tools=[],
    )
