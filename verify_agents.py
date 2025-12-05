import sys
import os
import asyncio

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from agents.coordinator import create_coordinator_agent
from agents.creator_agent import create_creator_agent
from google.adk.tools import google_search

async def test_agents():
    print("Testing Agent Instantiation...")
    
    # Test Creator Agent directly
    print("\n1. Testing Creator Agent...")
    creator = create_creator_agent(use_search=True)
    print(f"Creator Agent Name: {creator.name}")
    print(f"Creator Agent Tools: {[t.name for t in creator.tools]}")
    
    has_search = any(t.name == "google_search" for t in creator.tools)
    if has_search:
        print("SUCCESS: Creator Agent has google_search tool.")
    else:
        print("FAILURE: Creator Agent missing google_search tool.")
        
    # Test Coordinator Agent (should contain configured creator)
    print("\n2. Testing Coordinator Agent...")
    coordinator = create_coordinator_agent()
    print(f"Coordinator Agent Name: {coordinator.name}")
    
    # Inspect sub-agents
    # sub_agents = coordinator.sub_agents # Try public attribute if available, or just print repr
    print(f"Coordinator Agent: {coordinator}")
    # Note: ADK Agent structure might store sub-agents differently, let's just check if it initializes without error.
    print("Coordinator initialized successfully.")

if __name__ == "__main__":
    asyncio.run(test_agents())
