"""Custom ADK session service with database persistence."""

from typing import Optional, List, Any
from google.adk.sessions.base_session_service import BaseSessionService, ListSessionsResponse
from google.adk.sessions.session import Session
from google.genai.types import Content
from .connection import AsyncSessionLocal
from . import crud


class DatabaseSessionService(BaseSessionService):
    """Session service with database persistence."""
    
    def __init__(self):
        """Initialize the database session service."""
        super().__init__()
    
    async def create_session(
        self,
        user_id: str,
        session_id: str,
        app_name: str
    ) -> None:
        """Create a new session in the database."""
        async with AsyncSessionLocal() as db:
            await crud.create_session(db, session_id, user_id, app_name)
    
    async def get_session(
        self,
        *,
        app_name: str,
        user_id: str,
        session_id: str,
        config: Optional[Any] = None
    ) -> Optional[Session]:
        """Get session by ID."""
        async with AsyncSessionLocal() as db:
            db_session = await crud.get_session(db, session_id)
            if not db_session:
                return None
            
            # Map database model to ADK Session object
            session = Session(
                id=db_session.id,
                appName=db_session.app_name,
                userId=db_session.user_id,
                state=db_session.session_metadata or {},
                lastUpdateTime=db_session.updated_at.timestamp() if db_session.updated_at else 0.0
            )
            return session

    async def list_sessions(
        self,
        *,
        app_name: str,
        user_id: str
    ) -> ListSessionsResponse:
        """List all sessions for a user."""
        async with AsyncSessionLocal() as db:
            db_sessions = await crud.get_user_sessions(db, user_id)
            
            sessions = []
            for db_session in db_sessions:
                sessions.append(Session(
                    id=db_session.id,
                    appName=db_session.app_name,
                    userId=db_session.user_id,
                    state=db_session.session_metadata or {},
                    lastUpdateTime=db_session.updated_at.timestamp() if db_session.updated_at else 0.0
                ))
            
            return ListSessionsResponse(sessions=sessions)

    async def delete_session(
        self,
        *,
        app_name: str,
        user_id: str,
        session_id: str
    ) -> None:
        """Delete a session."""
        async with AsyncSessionLocal() as db:
            await crud.delete_session(db, session_id)

    async def get_history(
        self,
        user_id: str,
        session_id: str
    ) -> List[Content]:
        """Get conversation history from database."""
        async with AsyncSessionLocal() as db:
            messages = await crud.get_session_messages(db, session_id)
            
            # Convert database messages to ADK Content format
            history = []
            for msg in messages:
                history.append(Content(
                    role=msg.role,
                    parts=[{"text": msg.content}]
                ))
            
            return history
    
    async def add_message(
        self,
        user_id: str,
        session_id: str,
        message: Content
    ) -> None:
        """Add a message to the session history."""
        async with AsyncSessionLocal() as db:
            # Extract text from Content
            text_content = ""
            if message.parts:
                for part in message.parts:
                    if hasattr(part, 'text') and part.text:
                        text_content += part.text
                    elif isinstance(part, dict) and 'text' in part:
                        text_content += part['text']
            
            await crud.add_message(
                db,
                session_id=session_id,
                role=message.role,
                content=text_content
            )
    
    async def session_exists(
        self,
        user_id: str,
        session_id: str
    ) -> bool:
        """Check if a session exists."""
        async with AsyncSessionLocal() as db:
            session = await crud.get_session(db, session_id)
            return session is not None
