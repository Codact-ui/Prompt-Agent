"""API routes for prompts and templates management."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, crud
from api.data_models import (
    PromptCreate,
    PromptResponse,
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
)

router = APIRouter()

# Default user ID for now (can be replaced with auth later)
DEFAULT_USER_ID = "default_user"


# ===== Prompts Endpoints =====

@router.post("/prompts", response_model=PromptResponse)
async def create_prompt(
    prompt: PromptCreate,
    db: AsyncSession = Depends(get_db)
):
    """Save a prompt to the database."""
    db_prompt = await crud.create_prompt(
        db=db,
        user_id=DEFAULT_USER_ID,
        agent_type=prompt.agent_type,
        prompt_text=prompt.prompt_text,
        result=prompt.result,
        tags=prompt.tags
    )
    return db_prompt


@router.get("/prompts", response_model=List[PromptResponse])
async def get_prompts(
    agent_type: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get user's prompts, optionally filtered by agent type."""
    prompts = await crud.get_prompts(
        db=db,
        user_id=DEFAULT_USER_ID,
        agent_type=agent_type,
        limit=limit
    )
    return prompts


@router.get("/prompts/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific prompt."""
    prompt = await crud.get_prompt(db, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


@router.delete("/prompts/{prompt_id}")
async def delete_prompt(
    prompt_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a prompt."""
    deleted = await crud.delete_prompt(db, prompt_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"message": "Prompt deleted successfully"}


# ===== Templates Endpoints =====

@router.post("/templates", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new prompt template."""
    db_template = await crud.create_template(
        db=db,
        user_id=DEFAULT_USER_ID,
        name=template.name,
        template_text=template.template_text,
        description=template.description,
        category=template.category,
        is_public=template.is_public
    )
    return db_template


@router.get("/templates", response_model=List[TemplateResponse])
async def get_templates(
    category: Optional[str] = None,
    include_public: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Get user's templates, optionally filtered by category."""
    templates = await crud.get_templates(
        db=db,
        user_id=DEFAULT_USER_ID,
        category=category,
        include_public=include_public
    )
    return templates


@router.get("/templates/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific template."""
    template = await crud.get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template: TemplateUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a template."""
    updated = await crud.update_template(
        db=db,
        template_id=template_id,
        name=template.name,
        template_text=template.template_text,
        description=template.description,
        category=template.category
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Template not found")
    return updated


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a template."""
    deleted = await crud.delete_template(db, template_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}
