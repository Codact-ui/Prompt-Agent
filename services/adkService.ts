
import { PromptBlock, EvaluationResult, OptimizerResult, FewShotExample, AppSettings } from '../types';

// ADK Backend API URL from environment variables
// ADK API Server runs on port 8000 by default
const ADK_API_BASE = import.meta.env.VITE_ADK_BACKEND_URL || 'http://localhost:8000';

/**
 * Helper to call ADK API Server
 */
async function callAdkAgent(
    prompt: string,
    streaming: boolean = false
): Promise<Response> {
    const response = await fetch(`${ADK_API_BASE}/${streaming ? 'run_sse' : 'run'}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            appName: "prompt_engineering_coordinator", // Matches agent name in backend/agents/coordinator.py
            userId: "default_user", // Static user ID for now
            sessionId: `session_${Date.now()}`, // Unique session per request
            newMessage: {
                role: "user",
                parts: [{ text: prompt }]
            },
            streaming: streaming
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`ADK API Error: ${error}`);
    }

    return response;
}

/**
 * Convert ADK SSE response to async generator yielding text chunks
 */
async function* streamAdkResponse(response: Response): AsyncGenerator<{ text: string }, void, unknown> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available for streaming response');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process SSE events
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (dataStr === '[DONE]') continue;

                    try {
                        const data = JSON.parse(dataStr);
                        // ADK events usually have 'text' or 'delta' or 'parts'
                        // Adjust based on actual ADK event structure
                        if (data.text) {
                            yield { text: data.text };
                        } else if (data.delta) {
                            yield { text: data.delta };
                        } else if (data.parts && data.parts[0]?.text) {
                            yield { text: data.parts[0].text };
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE data:', dataStr);
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * Stream prompt creation from ADK Creator Agent
 */
export const streamCreatePrompt = async (
    goal: string,
    audience: string,
    constraints: string,
    settings: AppSettings,
    useSearch: boolean = false
) => {
    // Construct prompt for the Coordinator to delegate to Creator Agent
    const prompt = `
You are the Creator Agent.
Generate a comprehensive LLM prompt based on the following:

**Goal**: ${goal}
**Target Audience**: ${audience}
**Constraints**: ${constraints}
${useSearch ? '**Note**: Please use Google Search to verify facts if needed.' : ''}

Output the prompt clearly.
    `.trim();

    const response = await callAdkAgent(prompt, true);
    return streamAdkResponse(response);
};

/**
 * Enhance and structure a prompt using ADK Enhancer Agent
 */
export const enhancePrompt = async (prompt: string, settings: AppSettings): Promise<PromptBlock[]> => {
    const instruction = `
You are the Enhancer Agent.
Analyze the following prompt and structure it into logical blocks (Role, Context, Instruction, Constraints, etc.).
Return the result as a JSON object with a "blocks" key containing a list of blocks, where each block has "type", "content", and "rationale".

**Prompt to Enhance**:
${prompt}
    `.trim();

    const response = await callAdkAgent(instruction, false);
    const data = await response.json();

    // ADK /run response structure: { text: "...", ... }
    // We need to parse the JSON from the text response
    try {
        const text = data.text || (data.parts && data.parts[0]?.text) || "";
        // Find JSON in text (in case of markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        const parsed = JSON.parse(jsonStr);
        return parsed.blocks || [];
    } catch (e) {
        console.error("Failed to parse Enhancer response:", e);
        return [];
    }
};

/**
 * Evaluate a prompt using ADK Evaluator Agent
 */
export const evaluatePrompt = async (prompt: string, settings: AppSettings): Promise<EvaluationResult> => {
    const customRubric = settings.customEvaluationRubric || "";

    const instruction = `
You are the Evaluator Agent.
Evaluate the following prompt against best practices${customRubric ? ' and the custom rubric provided' : ''}.
Return the result as a JSON object with "score" (0-100), "strengths" (list), "weaknesses" (list), and "suggestions" (list).

**Prompt to Evaluate**:
${prompt}

${customRubric ? `**Custom Rubric**:\n${customRubric}` : ''}
    `.trim();

    const response = await callAdkAgent(instruction, false);
    const data = await response.json();

    try {
        const text = data.text || (data.parts && data.parts[0]?.text) || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse Evaluator response:", e);
        throw new Error("Invalid response format from Evaluator Agent");
    }
};

/**
 * Generate optimized prompt variations using ADK Optimizer Agent
 */
export const optimizePrompt = async (
    prompt: string,
    count: number,
    suggestions: string[],
    settings: AppSettings
): Promise<OptimizerResult[]> => {
    const instruction = `
You are the Optimizer Agent.
Generate ${count} optimized variations of the following prompt based on these suggestions:
${suggestions.map(s => `- ${s}`).join('\n')}

Return the result as a JSON object with a "variations" key containing a list of objects, each with "prompt" (string) and "explanation" (string).

**Original Prompt**:
${prompt}
    `.trim();

    const response = await callAdkAgent(instruction, false);
    const data = await response.json();

    try {
        const text = data.text || (data.parts && data.parts[0]?.text) || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        const parsed = JSON.parse(jsonStr);
        return parsed.variations || [];
    } catch (e) {
        console.error("Failed to parse Optimizer response:", e);
        return [];
    }
};

/**
 * Generate few-shot examples for a prompt
 */
export const generateFewShotExamples = async (
    prompt: string,
    count: number = 3,
    settings: AppSettings
): Promise<FewShotExample[]> => {
    const instruction = `
You are the Few-Shot Generator (part of Optimizer).
Generate ${count} high-quality few-shot examples (input-output pairs) for the following prompt.
Return the result as a JSON object with an "examples" key containing a list of objects, each with "input" and "output".

**Prompt**:
${prompt}
    `.trim();

    const response = await callAdkAgent(instruction, false);
    const data = await response.json();

    try {
        const text = data.text || (data.parts && data.parts[0]?.text) || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        const parsed = JSON.parse(jsonStr);
        return parsed.examples || [];
    } catch (e) {
        console.error("Failed to parse Few-Shot response:", e);
        return [];
    }
};

/**
 * Test a prompt with variable interpolation using ADK Playground Agent
 */
export const runTestPrompt = async (
    prompt: string,
    variables: Record<string, string>,
    settings: AppSettings
) => {
    const instruction = `
You are the Playground Agent.
Execute the following prompt by substituting the provided variables.
Return the output of the prompt execution.

**Prompt**:
${prompt}

**Variables**:
${JSON.stringify(variables, null, 2)}
    `.trim();

    const response = await callAdkAgent(instruction, true);
    return streamAdkResponse(response);
};
