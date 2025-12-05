import React, { useState, useCallback } from 'react';
import { streamCreatePrompt, savePrompt } from '../../services/adkService';
import { AgentType, HistoryItem } from '../../types';
import Header from '../Header';
import { CreateIcon, CopyIcon, SaveIcon, SearchIcon } from '../icons/AgentIcons';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Switch from '../ui/Switch';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import { useSettings } from '../../contexts/SettingsContext';

interface CreatorAgentProps {
  onSendToEnhance: (prompt: string) => void;
  onSendToEvaluate: (prompt: string) => void;
  addToHistory: (item: Omit<HistoryItem, 'id'>) => void;
  onRequestSaveTemplate: (prompt: string) => void;
}

const CreatorAgent: React.FC<CreatorAgentProps> = ({ onSendToEnhance, onSendToEvaluate, addToHistory, onRequestSaveTemplate }) => {
  const { settings } = useSettings();
  const [goal, setGoal] = useState('');
  const [audience, setAudience] = useState('');
  const [constraints, setConstraints] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copy, isCopied } = useCopyToClipboard();

  const handleGenerate = useCallback(async () => {
    if (!goal) {
      setError('Please provide a goal for the prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedPrompt('');
    let finalPrompt = '';
    try {
      const stream = await streamCreatePrompt(
        goal,
        audience,
        constraints,
        settings,
        useSearch,
        settings.selectedModel // Pass selected model
      );

      for await (const chunk of stream) {
        // Handle both string chunks and object chunks if the service returns them differently
        const text = typeof chunk === 'string' ? chunk : chunk.text;
        if (text) {
          finalPrompt += text;
          setGeneratedPrompt((prev) => prev + text);
        }
      }
    } catch (err) {
      setError('Failed to generate prompt. Please check your API key and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
      if (finalPrompt && !error) {
        addToHistory({
          agent: AgentType.CREATOR,
          prompt: `Goal: ${goal}`,
          result: finalPrompt,
          timestamp: new Date().toISOString(),
        });

        // Auto-save to database
        try {
          await savePrompt('creator', `Goal: ${goal}`, finalPrompt, []);
        } catch (saveError) {
          console.error('Failed to auto-save prompt to database:', saveError);
          // Don't show error to user as this is a background operation
        }
      }
    }
  }, [goal, audience, constraints, addToHistory, error, settings, useSearch]);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <Header
        icon={<CreateIcon />}
        title="Creator Agent"
        description="Start by defining your goal, and let the agent generate a structured prompt for you."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Define Your Goal</h3>
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal</label>
              <Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g., Generate a marketing campaign slogan" />
            </div>
            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience</label>
              <Input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g., Tech-savvy millennials" />
            </div>
            <div>
              <label htmlFor="constraints" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Constraints</label>
              <Textarea id="constraints" value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="e.g., Must be under 10 words, witty, and mention AI" />
            </div>

            <div className="flex items-center justify-between bg-notion-bg/50 p-3 rounded-md">
              <div className="flex items-center">
                <SearchIcon className="w-4 h-4 text-notion-accent mr-2" />
                <span className="text-sm font-medium">Use Google Search Grounding</span>
              </div>
              <Switch checked={useSearch} onCheckedChange={setUseSearch} />
            </div>
            <p className="text-xs text-gray-500">Enable to access real-time information for factual goals.</p>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
              {isLoading ? 'Generating...' : 'Generate Prompt'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Generated Prompt</h3>
              {generatedPrompt && !isLoading && (
                <div className="flex items-center space-x-2">
                  <Button onClick={() => copy(generatedPrompt)} variant="ghost" size="icon" title="Copy prompt">
                    <CopyIcon className="w-4 h-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
              )}
            </div>
            <div className="flex-grow w-full bg-gray-50 dark:bg-black/20 p-4 rounded-md border border-notion-border overflow-y-auto text-sm relative min-h-[300px]">
              {isLoading && !generatedPrompt && <div className="text-gray-400 animate-pulse">Waiting for generation...</div>}
              <MarkdownRenderer content={generatedPrompt} />
              {isCopied && <span className="absolute bottom-2 right-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Copied!</span>}
            </div>
            {generatedPrompt && !isLoading && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button onClick={() => onRequestSaveTemplate(generatedPrompt)} variant="primary" className="col-span-2">
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save as Template
                </Button>
                <Button onClick={() => onSendToEnhance(generatedPrompt)} variant="secondary">Enhance →</Button>
                <Button onClick={() => onSendToEvaluate(generatedPrompt)} variant="secondary">Evaluate →</Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreatorAgent;
