"""API routes for agent endpoints."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.agents import (
    create_creator_agent,
    create_enhancer_agent,
    create_evaluator_agent,
    create_optimizer_agent,
    create_playground_agent,
)
from backend.api.models import (
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
from backend.tools.variable_tool import interpolate_variables, find_missing_variables
import json
import asyncio
from typing import AsyncGenerator

router = APIRouter()


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
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService
        
        # Create runner with in-memory session service
        session_service = InMemorySessionService()
        runner = Runner(agent=agent, session_service=session_service)
        
        # Run agent asynchronously and collect events
        full_text = ""
        async for event in runner.run_async(user_message=prompt):
            # Extract text from agent response events
            if hasattr(event, 'data') and hasattr(event.data, 'text'):
                text_chunk = event.data.text
                full_text += text_chunk
                yield text_chunk
            elif hasattr(event, 'text'):
                text_chunk = event.text
                full_text += text_chunk
                yield text_chunk
                
        # If no streaming occurred, return accumulated text in chunks
        if not full_text and hasattr(event, 'response'):
            full_text = str(event.response)
            chunk_size = 50
            for i in range(0, len(full_text), chunk_size):
                yield full_text[i:i + chunk_size]
                await asyncio.sleep(0.01)
    except Exception as e:
        yield f"\n\n[Error: {str(e)}]"





@router.post("/agents/create")
async def create_prompt(request: CreatePromptRequest):
    """
    Stream prompt creation from Creator Agent.
    
    Creates a comprehensive prompt based on goal, audience, and constraints.
    Optionally uses Google Search for grounding.
    """
    try:
        agent = create_creator_agent(use_search=request.use_search)
        
        prompt_text = f"""
Generate a comprehensive LLM prompt based on the following:

**Goal**: {request.goal}
**Target Audience**: {request.audience or 'General'}
**Constraints**: {request.constraints or 'None specified'}

Create a well-structured prompt with clear sections.
        """.strip()
        
        return StreamingResponse(
            stream_agent_response(agent, prompt_text),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/enhance", response_model=EnhancePromptResponse)
async def enhance_prompt(request: EnhancePromptRequest):
    """
    Enhance and structure a prompt into logical blocks.
    
    Breaks down the prompt into organized components with rationales.
    """
    try:
        agent = create_enhancer_agent()
        
        prompt_text = f"""
Analyze and structure the following prompt into logical blocks.

Prompt to analyze:
---
{request.prompt}
---

Return a JSON array of blocks.
        """.strip()
        
        # Get response from agent
        response = await agent.generate(prompt_text)
        
        # Parse JSON response
        response_text = response.text if hasattr(response, 'text') else str(response)
        
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
        agent = create_evaluator_agent(custom_rubric=request.custom_rubric)
        
        prompt_text = f"""
Evaluate the following prompt:

---
{request.prompt}
---

Provide detailed scores, risks, and suggestions in JSON format.
        """.strip()
        
        response = await agent.generate(prompt_text)
        response_text = response.text if hasattr(response, 'text') else str(response)
        
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
        agent = create_optimizer_agent()
        
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
        
        response = await agent.generate(prompt_text)
        response_text = response.text if hasattr(response, 'text') else str(response)
        
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
        
        agent = create_playground_agent()
        
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
        agent = create_creator_agent()
        
        prompt_text = f"""
Generate {request.count} high-quality few-shot examples for this prompt:

---
{request.prompt}
---

Return as JSON array with 'input' and 'output' fields.
        """.strip()
        
        response = await agent.generate(prompt_text)
        response_text = response.text if hasattr(response, 'text') else str(response)
        
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
