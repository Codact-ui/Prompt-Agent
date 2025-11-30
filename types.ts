
export enum AgentType {
  CREATOR = 'Creator',
  ENHANCER = 'Enhancer',
  EVALUATOR = 'Evaluator',
  OPTIMIZER = 'Optimizer',
  PLAYGROUND = 'Playground'
}

export enum ViewType {
  HOME = 'Home',
  CREATOR = 'Creator',
  ENHANCER = 'Enhancer',
  EVALUATOR = 'Evaluator',
  OPTIMIZER = 'Optimizer',
  PLAYGROUND = 'Playground',
  HISTORY = 'History',
  SETTINGS = 'Settings',
  TEMPLATES = 'Templates'
}


export interface PromptBlock {
  id: string;
  type: string;
  content: string;
  rationale?: string;
}

export interface EvaluationScore {
  criteria: string;
  score: number;
  rationale: string;
}

export interface EvaluationResult {
  scores: EvaluationScore[];
  risks: string[];
  suggestions: string[];
}

export interface OptimizerResult {
  id: string;
  prompt: string;
  rationale: string;
}

export interface FewShotExample {
  input: string;
  output: string;
}

export interface HistoryItem {
  id: string;
  agent: AgentType;
  prompt: string;
  result: string | PromptBlock[] | EvaluationResult | OptimizerResult[] | FewShotExample[];
  timestamp: string;
}

export interface TemplateItem {
    id: string;
    name: string;
    description?: string;
    prompt: string;
    tags: string[];
    variables: string[];
    timestamp: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface AppSettings {
    model: string;
    temperature: number;
    customEvaluationRubric: string;
}