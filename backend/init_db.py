"""Initialize the database."""

import asyncio
from config.settings import get_settings
from database import init_db


async def main():
    """Initialize database tables."""
    settings = get_settings()
    print("Initializing database...")
    print(f"Database URL: {settings.database_url if hasattr(settings, 'database_url') else 'sqlite:///./prompts.db'}")
    
    await init_db()
    
    print("✅ Database initialized successfully!")
    print("Tables created:")
    print("  - sessions")
    print("  - messages")
    print("  - prompts")
    print("  - templates")


if __name__ == "__main__":
    asyncio.run(main())
