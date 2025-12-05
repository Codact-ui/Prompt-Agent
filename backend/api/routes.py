"""API routes for agent endpoints."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from google.genai.types import Content, Part
from google.adk.runners import Runner
from database import DatabaseSessionService
from agents import (
    create_creator_agent,
    create_enhancer_agent,
    create_evaluator_agent,
    create_optimizer_agent,
    create_playground_agent,
)
from api.models import (
    CreatePromptRequest,
    EnhancePromptRequest,
    EvaluatePromptRequest,
    OptimizePromptRequest,
    TestPromptRequest,
    GenerateFewShotRequest,
    EnhancePromptResponse,
    EvaluationResult,
    OptimizePromptResponse,
    GenerateFewShotResponse,
    PromptBlock,
    OptimizerResult,
    FewShotExample,
)
from tools.variable_tool import interpolate_variables, find_missing_variables
import json
import asyncio
import uuid
from typing import AsyncGenerator

router = APIRouter()

# Global database-backed session service - persists across restarts!
_session_service = DatabaseSessionService()

async def get_session_service() -> DatabaseSessionService:
    """Get the global session service."""
    return _session_service

async def stream_agent_response(agent, prompt: str) -> AsyncGenerator[str, None]:
    """
    Stream response from an agent using ADK Runner.
    
    Args:
        agent: ADK agent instance
        prompt: Prompt to send to the agent
        
    Yields:
        Text chunks from the agent's response
    """
    try:
        print(f"[DEBUG] stream_agent_response: Starting with prompt length {len(prompt)}")
        
        # Yield initial data to flush the buffer and establish streaming connection
        yield ""
        
        session_service = await get_session_service()
        runner = Runner(agent=agent, session_service=session_service, app_name="prompt_agent")
        
        # Run agent asynchronously and collect events
        full_text = ""
        user_id = "default_user"
        # Use a consistent session ID for the user or generate new one?
        # For now, generate new one per request to avoid state pollution between requests
        # unless we want to support multi-turn chat later.
        session_id = str(uuid.uuid4())
        
        await session_service.create_session(user_id=user_id, session_id=session_id, app_name="prompt_agent")
        print(f"[DEBUG] Session created: {session_id}")
        
        message = Content(role="user", parts=[Part(text=prompt)])
        
        print(f"[DEBUG] Starting run_async...")
        event_count = 0
        last_event = None
        async for event in runner.run_async(new_message=message, user_id=user_id, session_id=session_id):
            event_count += 1
            last_event = event
            event_type = type(event).__name__
            print(f"[DEBUG] Event {event_count}: {event_type}")
            
            text_chunk = None
            
            # Try multiple methods to extract text from event
            # Method 1: content.parts
            if hasattr(event, 'content') and event.content and hasattr(event.content, 'parts') and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        text_chunk = part.text
                        print(f"[DEBUG] Found text via content.parts: {len(text_chunk)} chars")
                        break
            
            # Method 2: data.text
            if not text_chunk and hasattr(event, 'data') and event.data and hasattr(event.data, 'text') and event.data.text:
                text_chunk = event.data.text
                print(f"[DEBUG] Found text via data.text: {len(text_chunk)} chars")
            
            # Method 3: direct text attribute
            if not text_chunk and hasattr(event, 'text') and event.text:
                text_chunk = event.text
                print(f"[DEBUG] Found text via text attr: {len(text_chunk)} chars")
            
            # Method 4: Check for response attribute (some ADK versions)
            if not text_chunk and hasattr(event, 'response') and event.response:
                if hasattr(event.response, 'text') and event.response.text:
                    text_chunk = event.response.text
                    print(f"[DEBUG] Found text via response.text: {len(text_chunk)} chars")
                elif isinstance(event.response, str):
                    text_chunk = event.response
                    print(f"[DEBUG] Found text via response (str): {len(text_chunk)} chars")
            
            # If still no text, log the event structure for debugging
            if not text_chunk:
                print(f"[DEBUG] No text found in event. Event attrs: {dir(event)}")
                if hasattr(event, 'content'):
                    print(f"[DEBUG] Event.content: {event.content}")
                if hasattr(event, 'data'):
                    print(f"[DEBUG] Event.data: {event.data}")
            
            # Yield the text if we found any
            if text_chunk:
                full_text += text_chunk
                yield text_chunk
                
        print(f"[DEBUG] Stream completed. Total events: {event_count}, Total text: {len(full_text)} chars")
        
        # If no streaming occurred, try to get response from last event
        if not full_text and last_event:
            print(f"[DEBUG] No text extracted, checking last_event for fallback")
            if hasattr(last_event, 'response') and last_event.response:
                fallback_text = str(last_event.response)
                if fallback_text and fallback_text != "None":
                    print(f"[DEBUG] Using last_event.response fallback: {len(fallback_text)} chars")
                    full_text = fallback_text
                    chunk_size = 200
                    for i in range(0, len(full_text), chunk_size):
                        yield full_text[i:i + chunk_size]
                        await asyncio.sleep(0.01)
                        
    except Exception as e:
        print(f"[DEBUG] stream_agent_response error: {str(e)}")
        import traceback
        traceback.print_exc()
        yield f"\n\n[Error: {str(e)}]"


async def run_agent(agent, prompt: str) -> str:
    """
    Run agent and return full text response using ADK Runner.
    Ensures app_name is passed to Runner initialization.
    """
    try:
        session_service = await get_session_service()
        runner = Runner(agent=agent, session_service=session_service, app_name="prompt_agent")
        
        # Run agent asynchronously and collect events
        full_text = ""
        last_event = None
        user_id = "default_user"
        session_id = str(uuid.uuid4())
        
        await session_service.create_session(user_id=user_id, session_id=session_id, app_name="prompt_agent")
        
        message = Content(role="user", parts=[Part(text=prompt)])
        
        async for event in runner.run_async(new_message=message, user_id=user_id, session_id=session_id):
            last_event = event
            # Extract text from agent response events
            if hasattr(event, 'content') and event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        full_text += part.text
            elif hasattr(event, 'data') and hasattr(event.data, 'text'):
                full_text += event.data.text
            elif hasattr(event, 'text'):
                full_text += event.text
                
        # If no streaming occurred, try to get response from last event
        if not full_text and last_event and hasattr(last_event, 'response'):
            full_text = str(last_event.response)
            
        return full_text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")


from services.model_service import get_available_models

@router.get("/models")
async def list_models():
    """
    List available models from configured providers.
    """
    return await get_available_models()


@router.post("/agents/create")
async def create_prompt(request: CreatePromptRequest):
    """
    Stream prompt creation from Creator Agent.
    
    Creates a comprehensive prompt based on goal, audience, and constraints.
    Optionally uses Google Search for grounding.
    """
    try:
        print(f"[DEBUG] create_prompt called with model: {request.model}")
        agent = create_creator_agent(use_search=request.use_search, model=request.model)
        
        prompt_text = f"""
Generate a comprehensive LLM prompt based on the following:

**Goal**: {request.goal}
**Target Audience**: {request.audience or 'General'}
**Constraints**: {request.constraints or 'None specified'}

Create a well-structured prompt with clear sections.
        """.strip()
        
        # Use proper streaming headers to prevent buffering
        headers = {
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Connection": "keep-alive",
        }
        
        return StreamingResponse(
            stream_agent_response(agent, prompt_text),
            media_type="text/event-stream",  # Use SSE for better streaming support
            headers=headers
        )
    except Exception as e:
        print(f"[DEBUG] create_prompt error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/enhance", response_model=EnhancePromptResponse)
async def enhance_prompt(request: EnhancePromptRequest):
    """
    Enhance and structure a prompt into logical blocks.
    
    Breaks down the prompt into organized components with rationales.
    """
    try:
        agent = create_enhancer_agent(model=request.model)
        
        prompt_text = f"""
Analyze and structure the following prompt into logical blocks.

Prompt to analyze:
---
{request.prompt}
---

Return a JSON array of blocks.
        """.strip()
        
        # Get response from agent using explicit Runner
        response_text = await run_agent(agent, prompt_text)
        
        # Try to extract JSON from response
        try:
            # Remove markdown code fences if present
            cleaned = response_text.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            if cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            blocks_data = json.loads(cleaned)
            
            # Convert to PromptBlock objects with IDs
            import time
            blocks = [
                PromptBlock(
                    id=f"{int(time.time() * 1000)}-{i}",
                    type=block.get('type', 'UNKNOWN'),
                    content=block.get('content', ''),
                    rationale=block.get('rationale')
                )
                for i, block in enumerate(blocks_data)
            ]
            
            return EnhancePromptResponse(blocks=blocks)
        except json.JSONDecodeError:
            # Fallback: create a single block
            import time
            return EnhancePromptResponse(
                blocks=[
                    PromptBlock(
                        id=f"{int(time.time() * 1000)}-0",
                        type="TASK",
                        content=request.prompt,
                        rationale="Original prompt preserved"
                    )
                ]
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/evaluate", response_model=EvaluationResult)
async def evaluate_prompt(request: EvaluatePromptRequest):
    """
    Evaluate a prompt against criteria.
    
    Analyzes the prompt and provides scores, risks, and suggestions.
    """
    try:
        agent = create_evaluator_agent(custom_rubric=request.custom_rubric, model=request.model)
        
        prompt_text = f"""
Evaluate the following prompt:

---
{request.prompt}
---

Provide detailed scores, risks, and suggestions in JSON format.
        """.strip()
        
        response_text = await run_agent(agent, prompt_text)
        
        # Parse JSON response
        try:
            cleaned = response_text.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            if cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            eval_data = json.loads(cleaned)
            return EvaluationResult(**eval_data)
        except json.JSONDecodeError:
            # Fallback evaluation
            return EvaluationResult(
                scores=[],
                risks=["Unable to parse evaluation results"],
                suggestions=["Please try again"]
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/optimize", response_model=OptimizePromptResponse)
async def optimize_prompt(request: OptimizePromptRequest):
    """
    Generate optimized prompt variations.
    
    Creates improved versions based on evaluation feedback.
    """
    try:
        agent = create_optimizer_agent(model=request.model)
        
        suggestions_text = '\n'.join(f'- {s}' for s in request.suggestions)
        
        prompt_text = f"""
Generate {request.count} improved variations of the following prompt.

Original Prompt:
---
{request.prompt}
---

Suggestions to incorporate:
{suggestions_text}

Return a JSON array of variations with prompts and rationales.
        """.strip()
        
        response_text = await run_agent(agent, prompt_text)
        
        # Parse JSON response
        try:
            cleaned = response_text.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            if cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            variations_data = json.loads(cleaned)
            
            import time
            variations = [
                OptimizerResult(
                    id=f"{int(time.time() * 1000)}-{i}",
                    prompt=var.get('prompt', ''),
                    rationale=var.get('rationale', '')
                )
                for i, var in enumerate(variations_data)
            ]
            
            return OptimizePromptResponse(variations=variations)
        except json.JSONDecodeError:
            return OptimizePromptResponse(variations=[])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/test")
async def test_prompt(request: TestPromptRequest):
    """
    Test a prompt with variable interpolation.
    
    Replaces variables and streams the execution result.
    """
    try:
        # Check for missing variables
        missing = find_missing_variables(request.prompt, request.variables)
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required variables: {', '.join(missing)}"
            )
        
        # Interpolate variables
        final_prompt = interpolate_variables(request.prompt, request.variables)
        
        agent = create_playground_agent(model=request.model)
        
        return StreamingResponse(
            stream_agent_response(agent, final_prompt),
            media_type="text/plain"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/few-shot", response_model=GenerateFewShotResponse)
async def generate_few_shot_examples(request: GenerateFewShotRequest):
    """
    Generate few-shot learning examples for a prompt.
    
    Creates example input-output pairs.
    """
    try:
        # Use creator agent for example generation
        agent = create_creator_agent(model=request.model)
        
        prompt_text = f"""
Generate {request.count} high-quality few-shot examples for this prompt:

---
{request.prompt}
---

Return as JSON array with 'input' and 'output' fields.
        """.strip()
        
        response_text = await run_agent(agent, prompt_text)
        
        try:
            cleaned = response_text.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            if cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            examples_data = json.loads(cleaned)
            examples = [FewShotExample(**ex) for ex in examples_data]
            
            return GenerateFewShotResponse(examples=examples)
        except json.JSONDecodeError:
            return GenerateFewShotResponse(examples=[])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
