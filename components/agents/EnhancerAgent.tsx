
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { enhancePrompt, generateFewShotExamples } from '../../services/adkService';
import { PromptBlock, HistoryItem, AgentType } from '../../types';
import Header from '../Header';
import { EnhanceIcon, CopyIcon, SaveIcon } from '../icons/AgentIcons';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Textarea from '../ui/Textarea';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import DiffViewer from '../ui/DiffViewer';
import Switch from '../ui/Switch';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import { useSettings } from '../../contexts/SettingsContext';


interface EnhancerAgentProps {
  initialPrompt: string;
  onSendToEvaluate: (prompt: string) => void;
  addToHistory: (item: Omit<HistoryItem, 'id'>) => void;
  onRequestSaveTemplate: (prompt: string) => void;
}

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200">
    {children}
  </span>
);

const EnhancerAgent: React.FC<EnhancerAgentProps> = ({ initialPrompt, onSendToEvaluate, addToHistory, onRequestSaveTemplate }) => {
  const { settings } = useSettings();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [enhancedBlocks, setEnhancedBlocks] = useState<PromptBlock[]>([]);
  const [acceptedBlocks, setAcceptedBlocks] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copy, isCopied } = useCopyToClipboard();

  const handleEnhance = useCallback(async (currentPrompt: string) => {
    if (!currentPrompt) {
      setError('Please provide a prompt to enhance.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEnhancedBlocks([]);
    try {
      const blocks = await enhancePrompt(currentPrompt, settings);
      setEnhancedBlocks(blocks);
      const initialAccepted: Record<string, boolean> = {};
      blocks.forEach(b => initialAccepted[b.id] = true);
      setAcceptedBlocks(initialAccepted);

      if (blocks.length > 0) {
        addToHistory({
          agent: AgentType.ENHANCER,
          prompt: currentPrompt,
          result: blocks,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError('Failed to enhance prompt. Please check your API key and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [addToHistory, settings]);

  const handleGenerateExamples = useCallback(async () => {
    if (!prompt) return;
    setIsGeneratingExamples(true);
    try {
      const examples = await generateFewShotExamples(prompt, 3, settings);
      const examplesText = `\n\n### Examples\n\n${examples.map(ex => `Input: ${ex.input}\nOutput: ${ex.output}`).join('\n\n')}`;
      setPrompt(prev => prev + examplesText);
    } catch (e) {
      console.error("Failed to generate examples", e);
      setError("Failed to generate examples.");
    } finally {
      setIsGeneratingExamples(false);
    }
  }, [prompt, settings]);

  useEffect(() => {
    setPrompt(initialPrompt);
    if (initialPrompt) handleEnhance(initialPrompt);
  }, [initialPrompt, handleEnhance]);


  const mergedPromptText = useMemo(() => {
    return enhancedBlocks
      .filter(b => acceptedBlocks[b.id])
      .map(b => `### ${b.type}\n${b.content}`)
      .join('\n\n');
  }, [enhancedBlocks, acceptedBlocks]);

  const toggleBlock = (id: string) => {
    setAcceptedBlocks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Header
        icon={<EnhanceIcon />}
        title="Enhancer Agent"
        description="Refine your prompt by breaking it into a structured, block-based format or automatically adding few-shot examples."
      />

      <div className="mt-8">
        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-2">Input Prompt</h3>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste your prompt here or send it from the Creator."
              rows={6}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={() => handleEnhance(prompt)} disabled={isLoading || isGeneratingExamples}>
                {isLoading ? 'Structuring...' : 'Structure Prompt'}
              </Button>
              <Button onClick={handleGenerateExamples} disabled={isLoading || isGeneratingExamples || !prompt} variant="secondary">
                {isGeneratingExamples ? 'Generating...' : '✨ Auto-Generate Examples'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {isLoading && enhancedBlocks.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-text mx-auto"></div>
          <p className="mt-4">Analyzing prompt structure...</p>
        </div>
      )}

      {enhancedBlocks.length > 0 && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Structured Blocks</h3>
            <div className="space-y-4">
              {enhancedBlocks.map((block) => (
                <Card key={block.id}>
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <Tag>{block.type}</Tag>
                      <Switch checked={acceptedBlocks[block.id] || false} onCheckedChange={() => toggleBlock(block.id)} />
                    </div>
                    <div className={`mt-2 text-notion-text transition-opacity ${acceptedBlocks[block.id] ? 'opacity-100' : 'opacity-50'}`}>
                      <MarkdownRenderer content={block.content} />
                    </div>
                    {block.rationale && (
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 border-t border-notion-border pt-2 italic">
                        Rationale: {block.rationale}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Live Diff Preview</h3>
            <Card>
              <div className="p-4 h-[600px] overflow-y-auto">
                <DiffViewer oldText={prompt} newText={mergedPromptText} />
              </div>
            </Card>
            <div className="mt-4 sticky bottom-4">
              <Card>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button onClick={() => copy(mergedPromptText)} variant="ghost" size="icon" title="Copy merged prompt" disabled={!mergedPromptText}><CopyIcon className="w-4 h-4" /></Button>
                    <Button onClick={() => onRequestSaveTemplate(mergedPromptText)} variant="ghost" size="icon" title="Save as Template" disabled={!mergedPromptText}><SaveIcon className="w-4 h-4" /></Button>
                  </div>
                  <Button onClick={() => onSendToEvaluate(mergedPromptText)} size="default" disabled={!mergedPromptText}>
                    Evaluate Prompt →
                  </Button>
                </div>
                {isCopied && <div className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-b-lg text-center">Copied!</div>}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancerAgent;
