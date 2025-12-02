"""Coordinator Agent for multi-agent orchestration."""
from google.adk.agents import Agent
from config.settings import get_settings
from agents.creator_agent import create_creator_agent
from agents.enhancer_agent import create_enhancer_agent
from agents.evaluator_agent import create_evaluator_agent
from agents.optimizer_agent import create_optimizer_agent
from agents.playground_agent import create_playground_agent


def create_coordinator_agent() -> Agent:
    """
    Creates the Coordinator Agent that manages the multi-agent system
    and routes requests to specialized agents.
    
    Returns:
        Configured parent Agent with sub-agents
    """
    settings = get_settings()
    
    return Agent(
        name="prompt_engineering_coordinator",
        model=settings.adk_model,
        instruction="""
You are the coordinator of a sophisticated prompt engineering multi-agent system.

Your Sub-Agents:
- **creator_agent**: Generates initial prompts from user goals, audience, and constraints
- **enhancer_agent**: Structures prompts into logical blocks with rationales
- **evaluator_agent**: Scores prompts against criteria and provides improvement suggestions
- **optimizer_agent**: Creates improved prompt variations based on feedback
- **playground_agent**: Tests prompts with variable interpolation

Responsibilities:
1. Understand user intent and requirements
2. Delegate tasks to the most appropriate specialized agent
3. Ensure smooth handoffs between agents for multi-step workflows
4. Coordinate complex operations that require multiple agents
5. Synthesize results from different agents into coherent responses

Always choose the right agent for the task and provide clear context for delegation.
        """.strip(),
        description="Coordinates specialized prompt engineering agents",
        sub_agents=[
            create_creator_agent(),
            create_enhancer_agent(),
            create_evaluator_agent(),
            create_optimizer_agent(),
            create_playground_agent(),
        ]
    )
