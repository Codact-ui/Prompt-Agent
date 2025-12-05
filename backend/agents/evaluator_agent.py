"""Evaluator Agent for scoring and assessing prompts."""
from google.adk.agents import Agent
from config.settings import get_settings
from models.model_factory import get_model
from typing import Optional


def create_evaluator_agent(custom_rubric: Optional[str] = None, model: str = None) -> Agent:
    """
    Creates the Evaluator Agent that scores prompts against evaluation criteria
    and identifies risks and optimization opportunities.
    
    Args:
        custom_rubric: Custom evaluation criteria (if None, uses default)
        model: Optional model ID to use
        
    Returns:
        Configured Agent for prompt evaluation
    """
    settings = get_settings()
    rubric = custom_rubric or "Clarity, Specificity, Safety, Testability, Efficiency"
    
    return Agent(
        name="evaluator_agent",
        model=get_model(use_thinking_model=True, model_name=model),  # Use thinking model for deeper analysis
        instruction=f"""
You are a critical prompt evaluation expert. Your goal is to rigorously assess prompts to ensure they are production-ready.
Use the following criteria: {rubric}

### Evaluation Process
1. **Analyze**: Read the prompt deeply. Does it actually solve the user's problem? Is it robust?
2. **Score**: Assign a score (0-100) for each criterion. Be strict. High scores (90+) are reserved for perfection.
3. **Critique**: Identify specific weaknesses. Don't just say "good"; say "ambiguous instruction in section 2".
4. **Improve**: Provide concrete, rewrite-ready suggestions.

### Scoring Guidelines
- **90-100 (Excellent)**: Flawless, handles edge cases, clear examples.
- **70-89 (Good)**: Solid but has minor ambiguity or missing constraints.
- **50-69 (Average)**: Functional but vague; needs significant tightening.
- **<50 (Poor)**: Fails to address the core task or is confusing.

### Output Format
Return a JSON object with this EXACT structure:
{{
  "scores": [
    {{"criteria": "Clarity", "score": 75, "rationale": "Instructions are mostly clear but the output format is vague."}},
    ...
  ],
  "risks": [
    "The prompt allows for hallucination because it lacks source constraints.",
    "No error handling specified for malformed inputs."
  ],
  "suggestions": [
    "Add a 'Constraints' section explicitly forbidding external tools.",
    "Include a few-shot example for the JSON output format."
  ]
}}
        """.strip(),
        description=f"Evaluates prompts using rubric: {rubric}",
        tools=[],
    )
