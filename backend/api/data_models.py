"""API models for prompts and templates management."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PromptCreate(BaseModel):
    """Create prompt request."""
    agent_type: str
    prompt_text: str
    result: Optional[str] = None
    tags: Optional[List[str]] = None


class PromptResponse(BaseModel):
    """Prompt response."""
    id: int
    user_id: str
    agent_type: str
    prompt_text: str
    result: Optional[str]
    created_at: datetime
    tags: Optional[List[str]]


class TemplateCreate(BaseModel):
    """Create template request."""
    name: str
    template_text: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_public: bool = False


class TemplateUpdate(BaseModel):
    """Update template request."""
    name: Optional[str] = None
    template_text: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None


class TemplateResponse(BaseModel):
    """Template response."""
    id: int
    user_id: str
    name: str
    description: Optional[str]
    template_text: str
    category: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: datetime
