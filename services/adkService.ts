
import { PromptBlock, EvaluationResult, OptimizerResult, FewShotExample, AppSettings } from '../types';

// ADK Backend API URL from environment variables
const ADK_API_BASE = import.meta.env.VITE_ADK_BACKEND_URL || 'http://localhost:8000/api';

/**
 * Stream prompt creation from Creator Agent
 */
export const streamCreatePrompt = async (
    goal: string,
    audience: string,
    constraints: string,
    settings: AppSettings,
    useSearch: boolean = false
) => {
    const response = await fetch(`${ADK_API_BASE}/agents/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            goal,
            audience,
            constraints,
            use_search: useSearch
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create prompt: ${error}`);
    }

    return streamResponse(response);
};

/**
 * Enhance and structure a prompt using Enhancer Agent
 */
export const enhancePrompt = async (prompt: string, settings: AppSettings): Promise<PromptBlock[]> => {
    const response = await fetch(`${ADK_API_BASE}/agents/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
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
    customRubric?: string
): Promise<EvaluationResult> => {
    const response = await fetch(`${ADK_API_BASE}/agents/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            custom_rubric: customRubric
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
    settings: AppSettings
): Promise<OptimizerResult[]> => {
    const response = await fetch(`${ADK_API_BASE}/agents/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            suggestions,
            count
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
    settings: AppSettings
): Promise<FewShotExample[]> => {
    const response = await fetch(`${ADK_API_BASE}/agents/few-shot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            count
        })
    });

    if (!response.ok) throw new Error('Failed to generate examples');
    const data = await response.json();
    return data.examples;
};

/**
 * Test a prompt with variable interpolation
 */
export const runTestPrompt = async (
    prompt: string,
    variables: Record<string, string>,
    settings: AppSettings
) => {
    const response = await fetch(`${ADK_API_BASE}/agents/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            variables
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to run test: ${error}`);
    }

    return streamResponse(response);
};

/**
 * Helper to stream response text
 */
async function* streamResponse(response: Response): AsyncGenerator<{ text: string }, void, unknown> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    const decoder = new TextDecoder();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            if (text) {
                yield { text };
            }
        }
    } finally {
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
