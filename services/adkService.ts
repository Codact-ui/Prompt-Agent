
import { PromptBlock, EvaluationResult, OptimizerResult, FewShotExample, AppSettings, Model } from '../types';

// ADK Backend API URL from environment variables
const ADK_API_BASE = import.meta.env.VITE_ADK_BACKEND_URL || 'http://localhost:8000/api';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Helper to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch available models
 */
export const getModels = async (): Promise<Model[]> => {
    const response = await fetch(`${ADK_API_BASE}/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    return await response.json();
};

/**
 * Stream prompt creation from Creator Agent with retry logic
 */
export const streamCreatePrompt = async function* (
    goal: string,
    audience: string,
    constraints: string,
    settings: AppSettings,
    useSearch: boolean = false,
    model?: string
): AsyncGenerator<{ text: string }, void, unknown> {
    const payload = {
        goal,
        audience,
        constraints,
        use_search: useSearch,
        model
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`[adkService] streamCreatePrompt attempt ${attempt}/${MAX_RETRIES}`, payload);

        try {
            const response = await fetch(`${ADK_API_BASE}/agents/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to create prompt: ${error}`);
            }

            // Collect chunks and check if we got any content
            let hasContent = false;
            const chunks: { text: string }[] = [];

            for await (const chunk of streamResponse(response)) {
                if (chunk.text && chunk.text.trim()) {
                    hasContent = true;
                    chunks.push(chunk);
                }
            }

            // If we got content, yield all chunks and return
            if (hasContent) {
                console.log(`[adkService] streamCreatePrompt succeeded on attempt ${attempt} with ${chunks.length} chunks`);
                for (const chunk of chunks) {
                    yield chunk;
                }
                return;
            }

            // No content received - retry
            console.warn(`[adkService] streamCreatePrompt attempt ${attempt} returned empty response, retrying...`);
            lastError = new Error('Empty response from server');

            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY_MS * attempt); // Exponential backoff
            }

        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.error(`[adkService] streamCreatePrompt attempt ${attempt} failed:`, lastError);

            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY_MS * attempt);
            }
        }
    }

    // All retries exhausted
    console.error(`[adkService] streamCreatePrompt failed after ${MAX_RETRIES} attempts`);
    yield { text: `\n\n[Error: Failed after ${MAX_RETRIES} attempts. ${lastError?.message || 'Unknown error'}]` };
};

/**
 * Enhance and structure a prompt using Enhancer Agent
 */
export const enhancePrompt = async (prompt: string, settings: AppSettings, model?: string): Promise<PromptBlock[]> => {
    const response = await fetch(`${ADK_API_BASE}/agents/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
    });

    if (!response.ok) throw new Error('Failed to enhance prompt');
    const data = await response.json();
    return data.blocks;
};

/**
 * Evaluate a prompt using Evaluator Agent
 */
export const evaluatePrompt = async (
    prompt: string,
    settings: AppSettings,
    customRubric?: string,
    model?: string
): Promise<EvaluationResult> => {
    const response = await fetch(`${ADK_API_BASE}/agents/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            custom_rubric: customRubric,
            model
        })
    });

    if (!response.ok) throw new Error('Failed to evaluate prompt');
    return await response.json();
};

/**
 * Optimize a prompt using Optimizer Agent
 */
export const optimizePrompt = async (
    prompt: string,
    count: number = 3,
    suggestions: string[],
    settings: AppSettings,
    model?: string
): Promise<OptimizerResult[]> => {
    const response = await fetch(`${ADK_API_BASE}/agents/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            suggestions,
            count,
            model
        })
    });

    if (!response.ok) throw new Error('Failed to optimize prompt');
    const data = await response.json();
    return data.variations;
};

/**
 * Generate few-shot examples
 */
export const generateFewShotExamples = async (
    prompt: string,
    count: number = 3,
    settings: AppSettings,
    model?: string
): Promise<FewShotExample[]> => {
    const response = await fetch(`${ADK_API_BASE}/agents/few-shot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            count,
            model
        })
    });

    if (!response.ok) throw new Error('Failed to generate examples');
    const data = await response.json();
    return data.examples;
};

/**
 * Test a prompt with variable interpolation - with retry logic
 */
export const runTestPrompt = async function* (
    prompt: string,
    variables: Record<string, string>,
    settings: AppSettings,
    model?: string
): AsyncGenerator<{ text: string }, void, unknown> {
    const payload = { prompt, variables, model };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`[adkService] runTestPrompt attempt ${attempt}/${MAX_RETRIES}`);

        try {
            const response = await fetch(`${ADK_API_BASE}/agents/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to run test: ${error}`);
            }

            // Collect chunks and check if we got any content
            let hasContent = false;
            const chunks: { text: string }[] = [];

            for await (const chunk of streamResponse(response)) {
                if (chunk.text && chunk.text.trim()) {
                    hasContent = true;
                    chunks.push(chunk);
                }
            }

            if (hasContent) {
                console.log(`[adkService] runTestPrompt succeeded on attempt ${attempt} with ${chunks.length} chunks`);
                for (const chunk of chunks) {
                    yield chunk;
                }
                return;
            }

            console.warn(`[adkService] runTestPrompt attempt ${attempt} returned empty response, retrying...`);
            lastError = new Error('Empty response from server');

            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY_MS * attempt);
            }

        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.error(`[adkService] runTestPrompt attempt ${attempt} failed:`, lastError);

            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY_MS * attempt);
            }
        }
    }

    console.error(`[adkService] runTestPrompt failed after ${MAX_RETRIES} attempts`);
    yield { text: `\n\n[Error: Failed after ${MAX_RETRIES} attempts. ${lastError?.message || 'Unknown error'}]` };
};

/**
 * Helper to stream response text
 */
async function* streamResponse(response: Response): AsyncGenerator<{ text: string }, void, unknown> {
    console.log('[streamResponse] Starting stream processing');
    const reader = response.body?.getReader();
    if (!reader) {
        console.error('[streamResponse] No reader available');
        throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let chunkCount = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log(`[streamResponse] Stream done. Total chunks: ${chunkCount}`);
                break;
            }

            chunkCount++;
            const text = decoder.decode(value, { stream: true });
            console.log(`[streamResponse] Chunk ${chunkCount}: ${text.length} chars - "${text.substring(0, 50)}..."`);
            if (text) {
                yield { text };
            }
        }
    } finally {
        console.log('[streamResponse] Releasing reader lock');
        reader.releaseLock();
    }
}

// ===== Database API Methods =====

/**
 * Save a prompt to the database
 */
export const savePrompt = async (
    agentType: string,
    promptText: string,
    result?: string,
    tags?: string[]
): Promise<any> => {
    const response = await fetch(`${ADK_API_BASE}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            agent_type: agentType,
            prompt_text: promptText,
            result,
            tags
        })
    });

    if (!response.ok) throw new Error('Failed to save prompt');
    return await response.json();
};

/**
 * Get prompts from the database
 */
export const getPrompts = async (agentType?: string): Promise<any[]> => {
    let url = `${ADK_API_BASE}/prompts`;
    if (agentType) {
        url += `?agent_type=${agentType}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get prompts');
    return await response.json();
};

/**
 * Delete a prompt
 */
export const deletePrompt = async (id: number): Promise<void> => {
    const response = await fetch(`${ADK_API_BASE}/prompts/${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete prompt');
};

/**
 * Create a template
 */
export const createTemplate = async (
    name: string,
    templateText: string,
    description?: string,
    category?: string,
    isPublic: boolean = false
): Promise<any> => {
    const response = await fetch(`${ADK_API_BASE}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            template_text: templateText,
            description,
            category,
            is_public: isPublic
        })
    });

    if (!response.ok) throw new Error('Failed to create template');
    return await response.json();
};

/**
 * Get templates
 */
export const getTemplates = async (category?: string): Promise<any[]> => {
    let url = `${ADK_API_BASE}/templates`;
    if (category) {
        url += `?category=${category}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get templates');
    return await response.json();
};

/**
 * Update a template
 */
export const updateTemplate = async (
    id: number,
    updates: {
        name?: string;
        template_text?: string;
        description?: string;
        category?: string;
    }
): Promise<any> => {
    const response = await fetch(`${ADK_API_BASE}/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });

    if (!response.ok) throw new Error('Failed to update template');
    return await response.json();
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id: number): Promise<void> => {
    const response = await fetch(`${ADK_API_BASE}/templates/${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete template');
};
