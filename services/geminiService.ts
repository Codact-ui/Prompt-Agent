
import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import { PromptBlock, EvaluationResult, OptimizerResult, FewShotExample, AppSettings } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Robustly parses a JSON string from the Gemini API, cleaning up common markdown formatting.
 * @param jsonString The raw string response from the model.
 * @param fallback The value to return if parsing fails.
 * @returns The parsed JSON object or the fallback value.
 */
const parseGeminiJsonResponse = <T>(jsonString: string, fallback: T): T => {
    // The API may return the JSON wrapped in markdown code fences.
    const cleanedString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '');
    try {
        return JSON.parse(cleanedString);
    } catch (e) {
        console.error("Failed to parse Gemini JSON response:", e, "\nRaw response:", jsonString);
        return fallback;
    }
};


export const streamCreatePrompt = async (
  goal: string,
  audience: string,
  constraints: string,
  settings: AppSettings,
  useSearch: boolean = false
) => {
  const prompt = `
    You are a world-class prompt engineering agent. Your task is to generate a comprehensive, effective, and clear prompt for a large language model.

    **Goal of the prompt:**
    ${goal}

    **Target Audience for the model's response:**
    ${audience}

    **Constraints and requirements:**
    ${constraints}

    Generate the prompt now. Structure it clearly with sections like "Role", "Task", "Instructions", "Input/Output Format", and "Examples" if applicable.
    Use Markdown formatting for headers, lists, and code blocks.
  `;
  
  const config: any = {
      temperature: settings.temperature,
  };

  if (useSearch) {
      config.tools = [{ googleSearch: {} }];
  }
  
  return ai.models.generateContentStream({
    model: settings.model, // Use model from settings
    contents: prompt,
    config: config
  });
};

export const enhancePrompt = async (prompt: string, settings: AppSettings): Promise<PromptBlock[]> => {
  const requestPrompt = `
    Analyze the following LLM prompt and break it down into a structured format of blocks. 
    For each block, provide a one-sentence rationale for why this structure improves the prompt.
    The block types should be one of: ROLE, TASK, INSTRUCTION, CONTEXT, EXAMPLE, OUTPUT_FORMAT, GUARDRAIL.

    Prompt to analyze:
    ---
    ${prompt}
    ---
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: settings.model,
    contents: requestPrompt,
    config: {
      temperature: settings.temperature,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: 'A unique identifier for the block, like a timestamp or random string.'
            },
            type: {
              type: Type.STRING,
              description: 'The type of the block (e.g., ROLE, TASK, INSTRUCTION).'
            },
            content: {
              type: Type.STRING,
              description: 'The content of the prompt block.'
            },
            rationale: {
              type: Type.STRING,
              description: 'A brief rationale for this block.'
            }
          },
          required: ["id", "type", "content", "rationale"]
        }
      }
    }
  });

  const jsonString = response.text.trim();
  const parsed = parseGeminiJsonResponse<Omit<PromptBlock, 'id'>[]>(jsonString, []);
  // Add unique IDs if the model doesn't provide them well
  return parsed.map((p, index) => ({...p, id: `${Date.now()}-${index}` }));
};

export const evaluatePrompt = async (prompt: string, settings: AppSettings): Promise<EvaluationResult> => {
  const rubric = settings.customEvaluationRubric || "Clarity, Specificity, Safety, Testability, Efficiency";

  const requestPrompt = `
    You are a prompt evaluation expert. Analyze the following prompt based on the following rubric: ${rubric}.
    For each criterion in the rubric, provide a score from 0 to 100 and a brief one-sentence rationale.
    Also, list up to 3 potential risks or weaknesses.
    Finally, based on your analysis, provide a list of 2-4 concrete, actionable suggestions for how to optimize this prompt.

    Prompt to evaluate:
    ---
    ${prompt}
    ---
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: settings.model,
    contents: requestPrompt,
    config: {
      temperature: settings.temperature,
      thinkingConfig: { thinkingBudget: 2048 }, 
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                criteria: { type: Type.STRING },
                score: { type: Type.INTEGER },
                rationale: { type: Type.STRING },
              },
              required: ["criteria", "score", "rationale"]
            }
          },
          risks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Actionable suggestions for prompt optimization."
          }
        },
        required: ["scores", "risks", "suggestions"]
      }
    }
  });
  
  const jsonString = response.text.trim();
  return parseGeminiJsonResponse<EvaluationResult>(jsonString, { scores: [], risks: [], suggestions: [] });
};


export const optimizePrompt = async (prompt: string, count: number, suggestions: string[], settings: AppSettings): Promise<OptimizerResult[]> => {
    const requestPrompt = `
      You are a prompt optimization expert. Your task is to take the user's prompt and generate ${count} improved variations of it.
      
      **Use the following expert suggestions to guide your optimizations:**
      ${suggestions.map(s => `- ${s}`).join('\n')}

      For each new variation, rewrite the original prompt to be clearer, more specific, more efficient, or more robust, incorporating the suggestions provided.
      Also, provide a brief, one-sentence rationale explaining the key improvement you made for each variation.

      Original Prompt:
      ---
      ${prompt}
      ---
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: settings.model,
        contents: requestPrompt,
        config: {
            temperature: settings.temperature,
            thinkingConfig: { thinkingBudget: 2048 },
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        prompt: {
                            type: Type.STRING,
                            description: "The full text of the optimized prompt variation."
                        },
                        rationale: {
                            type: Type.STRING,
                            description: "A brief rationale explaining the improvement."
                        }
                    },
                    required: ["prompt", "rationale"]
                }
            }
        }
    });

    const jsonString = response.text.trim();
    const parsed = parseGeminiJsonResponse<Omit<OptimizerResult, 'id'>[]>(jsonString, []);
    return parsed.map((p, index) => ({ ...p, id: `${Date.now()}-${index}` }));
};

export const generateFewShotExamples = async (prompt: string, count: number = 3, settings: AppSettings): Promise<FewShotExample[]> => {
    const requestPrompt = `
      Analyze the following prompt and generate ${count} high-quality "few-shot" examples (Input -> Output pairs) that would help the model understand the task better.
      
      The examples should be realistic, diverse, and strictly follow the logic implied by the prompt.

      Prompt to analyze:
      ---
      ${prompt}
      ---
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: settings.model,
        contents: requestPrompt,
        config: {
            temperature: settings.temperature,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        input: {
                            type: Type.STRING,
                            description: "The hypothetical user input."
                        },
                        output: {
                            type: Type.STRING,
                            description: "The ideal model response."
                        }
                    },
                    required: ["input", "output"]
                }
            }
        }
    });

    const jsonString = response.text.trim();
    return parseGeminiJsonResponse<FewShotExample[]>(jsonString, []);
};

export const runTestPrompt = async (prompt: string, variables: Record<string, string>, settings: AppSettings) => {
    let finalPrompt = prompt;
    
    // Interpolate variables
    for (const [key, value] of Object.entries(variables)) {
        // Replace {{key}}, {{ key }}, {{key }} etc globally
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        finalPrompt = finalPrompt.replace(regex, value);
    }

    return ai.models.generateContentStream({
        model: settings.model,
        contents: finalPrompt,
        config: {
            temperature: settings.temperature,
        }
    });
};
