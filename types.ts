
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
}

export interface AppSettings {
  model: string;
  temperature: number;
  customEvaluationRubric: string;
}