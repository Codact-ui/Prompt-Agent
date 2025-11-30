
import React, { useState } from 'react';
import { HistoryItem, PromptBlock, EvaluationResult, OptimizerResult } from '../types';
import Header from './Header';
import { HistoryIcon, CopyIcon, SaveIcon } from './icons/AgentIcons';
import Card from './ui/Card';
import Button from './ui/Button';
import useCopyToClipboard from '../hooks/useCopyToClipboard';
import MarkdownRenderer from './ui/MarkdownRenderer';

interface HistoryItemCardProps {
    item: HistoryItem;
    onRequestSaveTemplate: (prompt: string) => void;
}

const HistoryItemCard: React.FC<HistoryItemCardProps> = ({ item, onRequestSaveTemplate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { copy, isCopied } = useCopyToClipboard();

    const getResultAsString = () => {
        if (typeof item.result === 'string') return item.result;
        if (Array.isArray(item.result) && item.result[0] && 'content' in item.result[0]) {
             return (item.result as PromptBlock[]).map(b => `### ${b.type}\n${b.content}`).join('\n\n');
        }
        return JSON.stringify(item.result, null, 2);
    }

    const renderResult = () => {
        if (typeof item.result === 'string') {
            return <MarkdownRenderer content={item.result} />
        }
        if (Array.isArray(item.result) && item.result.length > 0 && 'content' in item.result[0]) { // PromptBlock[]
            return (
                <div className="space-y-2">
                    {(item.result as PromptBlock[]).map(block => (
                         <div key={block.id} className="p-2 border border-notion-border rounded-md bg-notion-bg/50">
                            <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">{block.type}</span>
                            <div className="mt-1 text-sm"><MarkdownRenderer content={block.content} /></div>
                        </div>
                    ))}
                </div>
            )
        }
        if (Array.isArray(item.result) && item.result.length > 0 && 'rationale' in item.result[0]) { // OptimizerResult[]
            return (
                <div className="space-y-2">
                    {(item.result as OptimizerResult[]).map(res => (
                         <div key={res.id} className="p-2 border border-notion-border rounded-md bg-notion-bg/50">
                            <div className="text-sm"><MarkdownRenderer content={res.prompt} /></div>
                            <p className="mt-2 text-xs italic text-gray-500 border-t pt-1">{res.rationale}</p>
                        </div>
                    ))}
                </div>
            )
        }
        // EvaluationResult
        const result = item.result as EvaluationResult;
        return (
            <div>
                <h4 className="font-semibold mb-2">Scores:</h4>
                <div className="space-y-2 mb-4">
                {result.scores.map(s => (
                    <div key={s.criteria} className="text-sm">
                        <span>{s.criteria}: </span>
                        <span className="font-bold text-notion-accent">{s.score}/100</span>
                    </div>
                ))}
                </div>
                 <h4 className="font-semibold mb-2">Risks:</h4>
                 <ul className="list-disc list-inside text-sm mb-4">
                     {result.risks.length > 0 ? result.risks.map((r, i) => <li key={i}>{r}</li>) : <li>None identified.</li>}
                 </ul>
                 <h4 className="font-semibold mb-2">Suggestions:</h4>
                 <ul className="list-disc list-inside text-sm">
                     {result.suggestions.length > 0 ? result.suggestions.map((s, i) => <li key={i}>{s}</li>) : <li>None provided.</li>}
                 </ul>
            </div>
        )
    };
    
    return (
        <Card>
            <div className="p-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div>
                        <span className="font-semibold text-notion-accent">{item.agent}</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                    <button className="text-sm text-notion-accent">{isExpanded ? 'Hide' : 'Details'}</button>
                </div>
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-notion-border space-y-4">
                        <div>
                           <div className="flex justify-between items-center mb-1">
                             <h4 className="font-semibold text-xs uppercase text-gray-400">Prompt</h4>
                             <div className="flex items-center">
                                <Button onClick={(e) => { e.stopPropagation(); copy(item.prompt); }} variant="ghost" size="icon" title="Copy prompt"><CopyIcon className="w-4 h-4" /></Button>
                                <Button onClick={(e) => { e.stopPropagation(); onRequestSaveTemplate(item.prompt); }} variant="ghost" size="icon" title="Save as Template"><SaveIcon className="w-4 h-4" /></Button>
                             </div>
                           </div>
                           <p className="whitespace-pre-wrap text-sm p-2 bg-notion-bg/50 rounded-md">{item.prompt}</p>
                        </div>
                        <div>
                           <div className="flex justify-between items-center mb-1">
                                <h4 className="font-semibold text-xs uppercase text-gray-400">Result</h4>
                                {typeof item.result === 'string' && (
                                     <div className="flex items-center">
                                        <Button onClick={(e) => { e.stopPropagation(); copy(getResultAsString()); }} variant="ghost" size="icon" title="Copy result"><CopyIcon className="w-4 h-4" /></Button>
                                        <Button onClick={(e) => { e.stopPropagation(); onRequestSaveTemplate(getResultAsString()); }} variant="ghost" size="icon" title="Save as Template"><SaveIcon className="w-4 h-4" /></Button>
                                     </div>
                                )}
                           </div>
                            <div className="p-2 bg-notion-bg/50 rounded-md relative">
                                {renderResult()}
                                {isCopied && <span className="absolute bottom-1 right-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">Copied!</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}


const HistoryPanel: React.FC<{ history: HistoryItem[], onRequestSaveTemplate: (p: string) => void }> = ({ history, onRequestSaveTemplate }) => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <Header
        icon={<HistoryIcon />}
        title="Session History"
        description="Review your past generations, enhancements, and evaluations."
      />
      <div className="mt-8 space-y-4">
        {history.length > 0 ? (
            history.map(item => <HistoryItemCard key={item.id} item={item} onRequestSaveTemplate={onRequestSaveTemplate} />)
        ) : (
            <Card>
                <div className="p-10 text-center">
                    <p className="text-gray-500">Your history is empty.</p>
                    <p className="text-sm text-gray-400">Generated content will appear here.</p>
                </div>
            </Card>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
