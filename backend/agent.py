"""
Root agent definition for ADK.

This file exports a single root_agent that ADK's CLI tools (adk run, adk web, adk api_server) 
can discover and use automatically.
"""
from agents.coordinator import create_coordinator_agent

# Root agent that handles all prompt engineering tasks via coordination
root_agent = create_coordinator_agent()
