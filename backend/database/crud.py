"""CRUD operations for database models."""

from typing import List, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from .models import Session as SessionModel, Message, Prompt, Template


# ===== Sessions =====

async def create_session(db: AsyncSession, session_id: str, user_id: str, app_name: str) -> SessionModel:
    """Create a new session."""
    session = SessionModel(
        id=session_id,
        user_id=user_id,
        app_name=app_name
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: str) -> Optional[SessionModel]:
    """Get session by ID."""
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    return result.scalar_one_or_none()


async def get_user_sessions(db: AsyncSession, user_id: str, limit: int = 50) -> List[SessionModel]:
    """Get all sessions for a user."""
    result = await db.execute(
        select(SessionModel)
        .where(SessionModel.user_id == user_id)
        .order_by(SessionModel.updated_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def delete_session(db: AsyncSession, session_id: str) -> bool:
    """Delete a session."""
    result = await db.execute(delete(SessionModel).where(SessionModel.id == session_id))
    await db.commit()
    return result.rowcount > 0


# ===== Messages =====

async def add_message(db: AsyncSession, session_id: str, role: str, content: str) -> Message:
    """Add a message to a session."""
    message = Message(
        session_id=session_id,
        role=role,
        content=content
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def get_session_messages(db: AsyncSession, session_id: str) -> List[Message]:
    """Get all messages for a session."""
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.timestamp.asc())
    )
    return list(result.scalars().all())


# ===== Prompts =====

async def create_prompt(
    db: AsyncSession,
    user_id: str,
    agent_type: str,
    prompt_text: str,
    result: Optional[str] = None,
    tags: Optional[List[str]] = None
) -> Prompt:
    """Create a new prompt."""
    prompt = Prompt(
        user_id=user_id,
        agent_type=agent_type,
        prompt_text=prompt_text,
        result=result,
        tags=tags
    )
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    return prompt


async def get_prompts(
    db: AsyncSession,
    user_id: str,
    agent_type: Optional[str] = None,
    limit: int = 50
) -> List[Prompt]:
    """Get prompts for a user."""
    query = select(Prompt).where(Prompt.user_id == user_id)
    if agent_type:
        query = query.where(Prompt.agent_type == agent_type)
    query = query.order_by(Prompt.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_prompt(db: AsyncSession, prompt_id: int) -> Optional[Prompt]:
    """Get a specific prompt."""
    result = await db.execute(select(Prompt).where(Prompt.id == prompt_id))
    return result.scalar_one_or_none()


async def delete_prompt(db: AsyncSession, prompt_id: int) -> bool:
    """Delete a prompt."""
    result = await db.execute(delete(Prompt).where(Prompt.id == prompt_id))
    await db.commit()
    return result.rowcount > 0


# ===== Templates =====

async def create_template(
    db: AsyncSession,
    user_id: str,
    name: str,
    template_text: str,
    description: Optional[str] = None,
    category: Optional[str] = None,
    is_public: bool = False
) -> Template:
    """Create a new template."""
    template = Template(
        user_id=user_id,
        name=name,
        template_text=template_text,
        description=description,
        category=category,
        is_public=is_public
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


async def get_templates(
    db: AsyncSession,
    user_id: str,
    category: Optional[str] = None,
    include_public: bool = True
) -> List[Template]:
    """Get templates for a user."""
    query = select(Template).where(
        (Template.user_id == user_id) | (Template.is_public == True if include_public else False)
    )
    if category:
        query = query.where(Template.category == category)
    query = query.order_by(Template.updated_at.desc())
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_template(db: AsyncSession, template_id: int) -> Optional[Template]:
    """Get a specific template."""
    result = await db.execute(select(Template).where(Template.id == template_id))
    return result.scalar_one_or_none()


async def update_template(
    db: AsyncSession,
    template_id: int,
    name: Optional[str] = None,
    template_text: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = None
) -> Optional[Template]:
    """Update a template."""
    template = await get_template(db, template_id)
    if not template:
        return None
    
    if name is not None:
        template.name = name
    if template_text is not None:
        template.template_text = template_text
    if description is not None:
        template.description = description
    if category is not None:
        template.category = category
    
    template.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(template)
    return template


async def delete_template(db: AsyncSession, template_id: int) -> bool:
    """Delete a template."""
    result = await db.execute(delete(Template).where(Template.id == template_id))
    await db.commit()
    return result.rowcount > 0
