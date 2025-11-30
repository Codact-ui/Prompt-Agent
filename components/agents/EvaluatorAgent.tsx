
import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { evaluatePrompt } from '../../services/geminiService';
import { EvaluationResult, HistoryItem, AgentType } from '../../types';
import Header from '../Header';
import { EvaluateIcon, CopyIcon, SaveIcon } from '../icons/AgentIcons';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Textarea from '../ui/Textarea';
import { useTheme } from '../../contexts/ThemeContext';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import { useSettings } from '../../contexts/SettingsContext';

interface EvaluatorAgentProps {
  initialPrompt: string;
  addToHistory: (item: Omit<HistoryItem, 'id'>) => void;
  onRequestSaveTemplate: (prompt: string) => void;
  onOptimizeWithSuggestions: (prompt: string, evaluation: EvaluationResult) => void;
}

const ScoreBar: React.FC<{ label: string; score: number; rationale: string }> = ({ label, score, rationale }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-sm font-bold text-notion-accent">{score} / 100</span>
        </div>
        <div className="w-full bg-notion-border rounded-full h-2">
            <div className="bg-notion-accent h-2 rounded-full" style={{ width: `${score}%` }}></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{rationale}</p>
    </div>
);


const EvaluatorAgent: React.FC<EvaluatorAgentProps> = ({ initialPrompt, addToHistory, onRequestSaveTemplate, onOptimizeWithSuggestions }) => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copy, isCopied } = useCopyToClipboard();

  const handleEvaluate = useCallback(async (currentPrompt: string) => {
    if (!currentPrompt) {
      setError('Please provide a prompt to evaluate.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEvaluation(null);
    try {
      const result = await evaluatePrompt(currentPrompt, settings);
      setEvaluation(result);
      if (result.scores.length > 0) {
        addToHistory({
          agent: AgentType.EVALUATOR,
          prompt: currentPrompt,
          result: result,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError('Failed to evaluate prompt. Please check your API key and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [addToHistory, settings]);
  
  useEffect(() => {
    setPrompt(initialPrompt);
    if (initialPrompt) handleEvaluate(initialPrompt);
  }, [initialPrompt]);


  const chartData = evaluation?.scores.map(s => ({
    subject: s.criteria,
    A: s.score,
    fullMark: 100,
  }));

  const radarColor = theme === 'dark' ? '#5FA5FA' : '#2383E2';

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Header
        icon={<EvaluateIcon />}
        title="Evaluator Agent"
        description="Score your prompt, identify risks, and get actionable suggestions for optimization."
      />
      <div className="mt-8">
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Input Prompt</h3>
                {prompt && (
                    <div className="flex items-center space-x-2">
                        <Button onClick={() => copy(prompt)} variant="ghost" size="icon" title="Copy prompt"><CopyIcon className="w-4 h-4"/></Button>
                        <Button onClick={() => onRequestSaveTemplate(prompt)} variant="ghost" size="icon" title="Save as Template"><SaveIcon className="w-4 h-4"/></Button>
                    </div>
                )}
            </div>
            <div className="relative">
                <Textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="Paste your prompt here or send it from another agent."
                rows={6}
                />
                {isCopied && <span className="absolute bottom-2 right-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Copied!</span>}
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <Button onClick={() => handleEvaluate(prompt)} disabled={isLoading} className="mt-4">
              {isLoading ? 'Evaluating...' : 'Evaluate Prompt'}
            </Button>
          </div>
        </Card>
      </div>

      {isLoading && !evaluation && (
        <div className="text-center p-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-text mx-auto"></div>
          <p className="mt-4">Evaluating prompt...</p>
        </div>
      )}

      {evaluation && (
        <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <div className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Score Card</h3>
                    <div className="space-y-4">
                        {evaluation.scores.map(s => <ScoreBar key={s.criteria} label={s.criteria} score={s.score} rationale={s.rationale}/>)}
                    </div>
                    </div>
                </Card>
                <Card>
                    <div className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Score Radar</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke={theme === 'dark' ? '#4A5568' : '#EAEAEA'} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: theme === 'dark' ? '#A0AEC0' : '#37352F', fontSize: 12 }} />
                            <Radar name="Score" dataKey="A" stroke={radarColor} fill={radarColor} fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card>
                    <div className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Potential Risks</h3>
                        {evaluation.risks.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                            {evaluation.risks.map((risk, i) => <li key={i}>{risk}</li>)}
                        </ul>
                        ) : (
                        <p className="text-sm text-gray-500">No significant risks identified.</p>
                        )}
                    </div>
                </Card>
                <Card>
                    <div className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Optimization Suggestions</h3>
                        {evaluation.suggestions.length > 0 ? (
                        <ul className="list-disc list-inside space-y-2 text-sm text-notion-text">
                            {evaluation.suggestions.map((suggestion, i) => <li key={i}>{suggestion}</li>)}
                        </ul>
                        ) : (
                        <p className="text-sm text-gray-500">No specific suggestions available.</p>
                        )}
                    </div>
                </Card>
            </div>
            <div className="mt-8 flex justify-end">
                <Button onClick={() => onOptimizeWithSuggestions(prompt, evaluation)} size="default">
                    Optimize with Suggestions →
                </Button>
            </div>
        </div>
      )}
    </div>
  );
};

export default EvaluatorAgent;
