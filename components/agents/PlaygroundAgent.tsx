
import React, { useState, useEffect, useCallback } from 'react';
import { runTestPrompt } from '../../services/adkService';
import { AgentType, HistoryItem } from '../../types';
import Header from '../Header';
import { PlayIcon, CopyIcon, SaveIcon } from '../icons/AgentIcons';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Card from '../ui/Card';
import Input from '../ui/Input';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import DiffViewer from '../ui/DiffViewer';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import Switch from '../ui/Switch';
import { useSettings } from '../../contexts/SettingsContext';

interface PlaygroundAgentProps {
    initialPrompt: string;
    addToHistory: (item: Omit<HistoryItem, 'id'>) => void;
    onRequestSaveTemplate: (prompt: string) => void;
}

const PlaygroundAgent: React.FC<PlaygroundAgentProps> = ({ initialPrompt, addToHistory, onRequestSaveTemplate }) => {
    const { settings } = useSettings();
    const [prompt, setPrompt] = useState(initialPrompt);
    const [variables, setVariables] = useState<string[]>([]);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});

    // Output states
    const [output, setOutput] = useState('');
    const [outputB, setOutputB] = useState(''); // For comparison

    const [isLoading, setIsLoading] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { copy: copyA, isCopied: isCopiedA } = useCopyToClipboard();
    const { copy: copyB, isCopied: isCopiedB } = useCopyToClipboard();

    // Reset state when initialPrompt changes (e.g. incoming from another agent)
    useEffect(() => {
        setPrompt(initialPrompt);
        setShowDiff(false);
        setOutput('');
        setOutputB('');
    }, [initialPrompt]);

    // Extract variables in format {{variable_name}}
    useEffect(() => {
        const regex = /\{\{([^}]+)\}\}/g;
        const foundVars = new Set<string>();
        let match;
        while ((match = regex.exec(prompt)) !== null) {
            foundVars.add(match[1].trim());
        }
        setVariables(Array.from(foundVars));
    }, [prompt]);

    const handleVariableChange = (key: string, value: string) => {
        setVariableValues(prev => ({ ...prev, [key]: value }));
    };

    const runPrompt = async (targetSetOutput: React.Dispatch<React.SetStateAction<string>>) => {
        let finalOutput = '';
        try {
            const stream = await runTestPrompt(prompt, variableValues, settings, settings.selectedModel);
            for await (const chunk of stream) {
                const text = chunk.text;
                if (text) {
                    finalOutput += text;
                    targetSetOutput(prev => prev + text);
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
        return finalOutput;
    };

    const handleRun = useCallback(async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setOutput('');
        if (isCompareMode) setOutputB('');

        try {
            // Run A
            const resA = await runPrompt(setOutput);

            let historyResult = `Variables: ${JSON.stringify(variableValues)}\n\nOutput:\n${resA}`;

            // Run B (If Compare Mode)
            if (isCompareMode) {
                const resB = await runPrompt(setOutputB);
                historyResult += `\n\n--- Compare (Run B) ---\n${resB}`;
            }

            addToHistory({
                agent: AgentType.PLAYGROUND,
                prompt: prompt,
                result: historyResult,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            setError('Failed to run prompt. Please check API key.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, variableValues, addToHistory, isCompareMode, settings]);

    const isModified = prompt !== initialPrompt;

    return (
        <div className="max-w-7xl mx-auto p-8">
            <Header
                icon={<PlayIcon />}
                title="Playground"
                description="Test your prompts with real data. Toggle 'Compare Mode' to run simultaneous tests."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8 h-[calc(100vh-250px)]">
                {/* Left Column: Inputs (Take up 4 columns) */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                    <Card className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-notion-border flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Prompt Template</h3>
                                {isModified && (
                                    <span className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded-full font-medium">Modified</span>
                                )}
                            </div>
                            <div className="flex items-center space-x-1">
                                {isModified && (
                                    <>
                                        <Button
                                            onClick={() => { setPrompt(initialPrompt); setShowDiff(false); }}
                                            variant="ghost"
                                            size="sm"
                                            title="Revert to original"
                                        >
                                            Reset
                                        </Button>
                                        <Button
                                            onClick={() => setShowDiff(!showDiff)}
                                            variant="ghost"
                                            size="sm"
                                            className={showDiff ? "bg-notion-hover" : ""}
                                        >
                                            {showDiff ? "Edit" : "Changes"}
                                        </Button>
                                    </>
                                )}
                                <Button onClick={() => onRequestSaveTemplate(prompt)} variant="ghost" size="sm">
                                    <SaveIcon className="w-4 h-4 mr-2" /> Save
                                </Button>
                            </div>
                        </div>
                        <div className="p-4 flex-grow flex flex-col overflow-y-auto">
                            {showDiff ? (
                                <DiffViewer oldText={initialPrompt} newText={prompt} />
                            ) : (
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="flex-grow resize-none font-mono text-sm"
                                    placeholder="Write your prompt here. Use {{name}} for variables."
                                />
                            )}
                        </div>
                    </Card>

                    {variables.length > 0 && (
                        <Card>
                            <div className="p-4 bg-notion-bg/30">
                                <h3 className="font-semibold text-sm mb-3 uppercase text-gray-500">Variables</h3>
                                <div className="space-y-3 max-h-40 overflow-y-auto">
                                    {variables.map(v => (
                                        <div key={v}>
                                            <label className="block text-xs font-medium mb-1 text-notion-accent">{v}</label>
                                            <Input
                                                value={variableValues[v] || ''}
                                                onChange={(e) => handleVariableChange(v, e.target.value)}
                                                placeholder={`Value for ${v}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card>
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-sm font-medium">Compare Mode</span>
                            <Switch checked={isCompareMode} onCheckedChange={setIsCompareMode} />
                        </div>
                    </Card>

                    <Button onClick={handleRun} disabled={isLoading} className="w-full">
                        {isLoading ? 'Running...' : 'Run Prompt'}
                    </Button>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                {/* Right Column: Output (Take up 8 columns, split if comparing) */}
                <div className={`lg:col-span-8 grid ${isCompareMode ? 'grid-cols-2' : 'grid-cols-1'} gap-4 h-full`}>
                    {/* Output A */}
                    <Card className="h-full flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-notion-border flex justify-between items-center bg-notion-bg/20">
                            <h3 className="font-semibold">Result A</h3>
                            {output && (
                                <Button onClick={() => copyA(output)} variant="ghost" size="icon">
                                    <CopyIcon className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        <div className="p-6 flex-grow overflow-y-auto relative">
                            {output ? <MarkdownRenderer content={output} /> : <span className="text-gray-400 italic">Output will appear here...</span>}
                            {isCopiedA && <span className="absolute top-2 right-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Copied!</span>}
                        </div>
                    </Card>

                    {/* Output B (Only visible in Compare Mode) */}
                    {isCompareMode && (
                        <Card className="h-full flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-notion-border flex justify-between items-center bg-notion-bg/20">
                                <h3 className="font-semibold">Result B</h3>
                                {outputB && (
                                    <Button onClick={() => copyB(outputB)} variant="ghost" size="icon">
                                        <CopyIcon className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="p-6 flex-grow overflow-y-auto relative border-l border-notion-border">
                                {outputB ? <MarkdownRenderer content={outputB} /> : <span className="text-gray-400 italic">Second run output...</span>}
                                {isCopiedB && <span className="absolute top-2 right-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Copied!</span>}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaygroundAgent;
