import React, { useRef } from 'react';
import Header from './Header';
import { SettingsIcon } from './icons/AgentIcons';
import Card from './ui/Card';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsPanelProps {
    clearHistory: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ clearHistory }) => {
    const { theme, toggleTheme } = useTheme();
    const { settings, updateSettings, exportData, importData, availableModels, isLoadingModels } = useSettings();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const dataStr = exportData();
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `prompt-optimizer-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const success = importData(event.target.result as string);
                if (success) {
                    alert("Data imported successfully! The page will refresh.");
                    window.location.reload();
                } else {
                    alert("Failed to import data. Invalid JSON format.");
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <Header
                icon={<SettingsIcon />}
                title="Settings"
                description="Manage your global configuration, model preferences, and data."
            />

            <div className="mt-8 space-y-6">

                {/* Model Configuration */}
                <Card>
                    <div className="p-6 space-y-4">
                        <h4 className="font-semibold text-lg border-b border-notion-border pb-2">Model Configuration</h4>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select AI Model</label>
                                <select
                                    className="w-full rounded-md border border-notion-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-notion-accent dark:text-gray-200"
                                    value={settings.selectedModel || ''}
                                    onChange={(e) => updateSettings({ selectedModel: e.target.value })}
                                    disabled={isLoadingModels}
                                >
                                    {isLoadingModels && <option>Loading models...</option>}
                                    {!isLoadingModels && availableModels.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name} ({model.provider})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Choose the AI model to use for generating and analyzing prompts.</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Data Management */}
                <Card>
                    <div className="p-6 space-y-4">
                        <h4 className="font-semibold text-lg border-b border-notion-border pb-2">Data Management</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleExport} variant="secondary">Backup Data (JSON)</Button>
                            <Button onClick={handleImportClick} variant="secondary">Import Backup</Button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                        </div>
                        <div className="pt-4 mt-4 border-t border-notion-border flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-red-600">Danger Zone</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete all history and templates.</p>
                            </div>
                            <Button variant="danger" onClick={clearHistory}>
                                Clear All Data
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Appearance */}
                <Card>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold">Interface Theme</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between Light and Dark mode.</p>
                        </div>
                        <Button variant="secondary" onClick={toggleTheme}>
                            Switch to {theme === 'light' ? 'Dark' : 'Light'}
                        </Button>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default SettingsPanel;
