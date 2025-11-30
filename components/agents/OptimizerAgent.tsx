
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../Header';
import { OptimizeIcon, CopyIcon, SaveIcon } from '../icons/AgentIcons';
import Card from '../ui/Card';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { OptimizerResult, AgentType, HistoryItem } from '../../types';
import { optimizePrompt } from '../../services/geminiService';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import { useSettings } from '../../contexts/SettingsContext';

interface OptimizerAgentProps {
  initialPrompt: string;
  suggestions: string[];
  onSendToEnhance: (prompt: string) => void;
  onSendToEvaluate: (prompt:string) => void;
  addToHistory: (item: Omit<HistoryItem, 'id'>) => void;
  onRequestSaveTemplate: (prompt: string) => void;
}

const ResultCard: React.FC<{
    result: OptimizerResult;
    onSendToEnhance: (p: string) => void;
    onSendToEvaluate: (p: string) => void;
    onRequestSaveTemplate: (p: string) => void;
}> = ({ result, onSendToEnhance, onSendToEvaluate, onRequestSaveTemplate }) => {
    const { copy, isCopied } = useCopyToClipboard();

    return (
        <Card className="flex flex-col">
            <div className="p-4 flex-grow">
                <div className="text-sm text-notion-text">
                    <MarkdownRenderer content={result.prompt} />
                </div>
                 <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 border-t border-notion-border pt-2 italic">
                    Rationale: {result.rationale}
                </p>
            </div>
            <div className="p-2 border-t border-notion-border bg-notion-bg/50 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-1">
                    <Button onClick={() => onSendToEnhance(result.prompt)} variant="secondary" size="sm" disabled={!result.prompt}>Enhance</Button>
                    <Button onClick={() => onSendToEvaluate(result.prompt)} variant="secondary" size="sm" disabled={!result.prompt}>Evaluate</Button>
                </div>
                <div className="flex items-center">
                    <Button onClick={() => copy(result.prompt)} variant="ghost" size="icon" title="Copy" disabled={!result.prompt}><CopyIcon className="w-4 h-4"/></Button>
                    <Button onClick={() => onRequestSaveTemplate(result.prompt)} variant="secondary" size="sm" disabled={!result.prompt}>
                        <SaveIcon className="w-4 h-4 mr-2"/>
                        Save as Template
                    </Button>
                </div>
            </div>
            {isCopied && <div className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-b-lg text-center">Copied!</div>}
        </Card>
    );
};


const OptimizerAgent: React.FC<OptimizerAgentProps> = ({ initialPrompt, suggestions, onSendToEnhance, onSendToEvaluate, addToHistory, onRequestSaveTemplate }) => {
  const { settings } = useSettings();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [variationCount, setVariationCount] = useState(3);
  const [results, setResults] = useState<OptimizerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = useCallback(async () => {
    if (!prompt) {
        setError("Please provide a prompt to optimize.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
        const variations = await optimizePrompt(prompt, variationCount, suggestions, settings);
        setResults(variations);
        if (variations.length > 0) {
            addToHistory({
                agent: AgentType.OPTIMIZER,
                prompt: prompt,
                result: variations,
                timestamp: new Date().toISOString()
            });
        }
    } catch(err) {
        setError("Failed to optimize prompt. Please check your API key.");
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [prompt, variationCount, suggestions, addToHistory, settings]);

  useEffect(() => {
    setPrompt(initialPrompt);
    if(initialPrompt && suggestions.length > 0){
        handleOptimize();
    }
  }, [initialPrompt, suggestions, handleOptimize]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Header
        icon={<OptimizeIcon />}
        title="Optimizer Agent"
        description="Automatically evolve your prompt using evaluation-driven suggestions to find the optimal version."
      />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
            <Card>
                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Prompt</label>
                    <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={8} placeholder="Enter the prompt you want to improve."/>
                </div>
            </Card>
            {suggestions.length > 0 && (
                <Card>
                    <div className="p-6">
                        <h4 className="font-semibold text-lg mb-2">Using Suggestions:</h4>
                        <ul className="list-disc list-inside space-y-2 text-sm text-notion-text">
                            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                </Card>
            )}
            <Card>
                <div className="p-6">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Variations</label>
                    <Input type="number" value={variationCount} onChange={(e) => setVariationCount(Math.max(1, parseInt(e.target.value, 10)))} className="w-24" min="1" max="10"/>
                </div>
            </Card>
             {error && <p className="text-red-500 text-sm p-2">{error}</p>}
             <Button onClick={handleOptimize} disabled={isLoading} className="w-full">
                {isLoading ? 'Optimizing...' : `Regenerate ${variationCount} Variations`}
             </Button>
        </div>

        <div className="lg:col-span-2">
            {isLoading && results.length === 0 && (
            <div className="text-center p-8 text-gray-500 h-full flex flex-col justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-notion-text mx-auto"></div>
                <p className="mt-4 text-lg">Generating variations...</p>
            </div>
            )}

            {results.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">Optimized Candidates</h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {results.map(res => (
                            <ResultCard 
                                key={res.id} 
                                result={res} 
                                onSendToEnhance={onSendToEnhance} 
                                onSendToEvaluate={onSendToEvaluate}
                                onRequestSaveTemplate={onRequestSaveTemplate}
                            />
                        ))}
                    </div>
                </div>
            )}

            {!isLoading && results.length === 0 && (
                <Card>
                    <div className="p-10 text-center h-full flex flex-col justify-center items-center">
                        <p className="text-gray-500 text-lg">Ready to Optimize</p>
                        <p className="text-sm text-gray-400 mt-2">Adjust your settings and click 'Generate' to create improved prompt variations.</p>
                    </div>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
};

export default OptimizerAgent;
