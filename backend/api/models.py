"""Pydantic models for API requests and responses."""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional


# Request Models
class CreatePromptRequest(BaseModel):
    """Request model for creating a new prompt."""
    goal: str = Field(..., description="Goal of the prompt", min_length=1)
    audience: str = Field(default="", description="Target audience")
    constraints: str = Field(default="", description="Constraints and requirements")
    use_search: bool = Field(default=False, description="Enable Google Search grounding")
    model: Optional[str] = Field(None, description="Model ID to use (e.g., 'ollama/llama3')")


class EnhancePromptRequest(BaseModel):
    """Request model for enhancing/structuring a prompt."""
    prompt: str = Field(..., description="Prompt to enhance", min_length=1)
    model: Optional[str] = Field(None, description="Model ID to use")


class EvaluatePromptRequest(BaseModel):
    """Request model for evaluating a prompt."""
    prompt: str = Field(..., description="Prompt to evaluate", min_length=1)
    custom_rubric: Optional[str] = Field(None, description="Custom evaluation criteria")
    model: Optional[str] = Field(None, description="Model ID to use")


class OptimizePromptRequest(BaseModel):
    """Request model for optimizing a prompt."""
    prompt: str = Field(..., description="Prompt to optimize", min_length=1)
    count: int = Field(3, ge=1, le=5, description="Number of variations to generate")
    suggestions: List[str] = Field(..., description="Optimization suggestions from evaluation")
    model: Optional[str] = Field(None, description="Model ID to use")


class TestPromptRequest(BaseModel):
    """Request model for testing a prompt with variables."""
    prompt: str = Field(..., description="Prompt to test", min_length=1)
    variables: Dict[str, str] = Field(default_factory=dict, description="Variable values for interpolation")
    model: Optional[str] = Field(None, description="Model ID to use")


class GenerateFewShotRequest(BaseModel):
    """Request model for generating few-shot examples."""
    prompt: str = Field(..., description="Prompt to generate examples for", min_length=1)
    count: int = Field(3, ge=1, le=5, description="Number of examples to generate")
    model: Optional[str] = Field(None, description="Model ID to use")


# Response Models
class PromptBlock(BaseModel):
    """A structured block of a prompt."""
    id: str = Field(..., description="Unique identifier for the block")
    type: str = Field(..., description="Block type (ROLE, TASK, INSTRUCTION, etc.)")
    content: str = Field(..., description="Block content")
    rationale: Optional[str] = Field(None, description="Rationale for this block")


class EvaluationScore(BaseModel):
    """Score for a single evaluation criterion."""
    criteria: str = Field(..., description="Evaluation criterion name")
    score: int = Field(..., ge=0, le=100, description="Score from 0-100")
    rationale: str = Field(..., description="Explanation of the score")


class EvaluationResult(BaseModel):
    """Complete evaluation result for a prompt."""
    scores: List[EvaluationScore] = Field(..., description="Scores for each criterion")
    risks: List[str] = Field(..., description="Identified risks or weaknesses")
    suggestions: List[str] = Field(..., description="Actionable optimization suggestions")


class OptimizerResult(BaseModel):
    """An optimized prompt variation."""
    id: str = Field(..., description="Unique identifier")
    prompt: str = Field(..., description="Optimized prompt text")
    rationale: str = Field(..., description="Explanation of improvements")


class FewShotExample(BaseModel):
    """A few-shot learning example."""
    input: str = Field(..., description="Example input")
    output: str = Field(..., description="Example output")


# Additional Response Models
class EnhancePromptResponse(BaseModel):
    """Response for prompt enhancement."""
    blocks: List[PromptBlock]


class OptimizePromptResponse(BaseModel):
    """Response for prompt optimization."""
    variations: List[OptimizerResult]


class GenerateFewShotResponse(BaseModel):
    """Response for few-shot example generation."""
    examples: List[FewShotExample]


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details")
