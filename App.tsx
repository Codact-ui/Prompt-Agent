
import React, { useState, useCallback, useEffect } from 'react';
import { ViewType, AgentType, HistoryItem, TemplateItem, EvaluationResult, ToastMessage } from './types';
import { getTemplates, createTemplate, updateTemplate as apiUpdateTemplate, deleteTemplate as apiDeleteTemplate } from './services/adkService';
import Sidebar from './components/Sidebar';
import CreatorAgent from './components/agents/CreatorAgent';
import EnhancerAgent from './components/agents/EnhancerAgent';
import EvaluatorAgent from './components/agents/EvaluatorAgent';
import OptimizerAgent from './components/agents/OptimizerAgent';
import PlaygroundAgent from './components/agents/PlaygroundAgent';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import TemplatesPanel from './components/TemplatesPanel';
import ToastContainer from './components/ui/Toast';
import SaveTemplateModal from './components/SaveTemplateModal';
import HomePage from './components/HomePage';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>(ViewType.HOME);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptToSave, setPromptToSave] = useState<string | null>(null);
  const [templateToEdit, setTemplateToEdit] = useState<TemplateItem | null>(null);

  // History Management
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('promptHistory');
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch (error) { console.error("Failed to load history from localStorage", error); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('promptHistory', JSON.stringify(history));
    } catch (error) { console.error("Failed to save history to localStorage", error); }
  }, [history]);

  // Helper functions
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const foundVars = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      foundVars.add(match[1].trim());
    }
    return Array.from(foundVars);
  };

  // Template Management
  const fetchTemplates = useCallback(async () => {
    try {
      const data = await getTemplates();
      // Map backend response to frontend TemplateItem
      const mappedTemplates: TemplateItem[] = data.map((t: any) => ({
        id: t.id.toString(),
        name: t.name,
        description: t.description,
        prompt: t.template_text,
        tags: [], // Backend doesn't support tags for templates yet
        variables: extractVariables(t.template_text),
        timestamp: t.updated_at || t.created_at
      }));
      setTemplates(mappedTemplates);
    } catch (error) {
      console.error("Failed to load templates", error);
      // Don't show toast on initial load failure to avoid spamming if backend is down
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addTemplate = async (name: string, prompt: string, description: string = '', tags: string[] = []) => {
    try {
      await createTemplate(name, prompt, description, tags.length > 0 ? tags[0] : undefined);
      await fetchTemplates();
      addToast(`Template "${name}" saved!`, "success");
    } catch (error) {
      console.error("Failed to save template", error);
      addToast("Failed to save template", "error");
    }
  };

  const updateTemplate = async (id: string, updates: Partial<TemplateItem>) => {
    try {
      const backendUpdates: any = {};
      if (updates.name) backendUpdates.name = updates.name;
      if (updates.prompt) backendUpdates.template_text = updates.prompt;
      if (updates.description) backendUpdates.description = updates.description;

      await apiUpdateTemplate(parseInt(id), backendUpdates);
      await fetchTemplates();
      addToast("Template updated successfully", "success");
    } catch (error) {
      console.error("Failed to update template", error);
      addToast("Failed to update template", "error");
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await apiDeleteTemplate(parseInt(id));
      await fetchTemplates();
      addToast("Template deleted.", "success");
    } catch (error) {
      console.error("Failed to delete template", error);
      addToast("Failed to delete template", "error");
    }
  };

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
  };

  const addToHistory = useCallback((item: Omit<HistoryItem, 'id'>) => {
    const newItem = { ...item, id: new Date().toISOString() };
    setHistory(prev => [newItem, ...prev]);
  }, []);

  const clearHistory = () => {
    setHistory([]);
    addToast("History cleared successfully.", "success");
  };

  const handleModalSave = (name: string, prompt: string, description: string, tags: string[]) => {
    if (templateToEdit) {
      updateTemplate(templateToEdit.id, { name, prompt, description, tags });
    } else {
      addTemplate(name, prompt, description, tags);
    }
    setIsModalOpen(false);
    setTemplateToEdit(null);
    setPromptToSave(null);
  };

  const handleRequestSaveTemplate = (prompt: string) => {
    if (!prompt) {
      addToast("Cannot save an empty prompt.", "error");
      return;
    }
    setTemplateToEdit(null);
    setPromptToSave(prompt);
    setIsModalOpen(true);
  };

  const handleRequestEditTemplate = (template: TemplateItem) => {
    setTemplateToEdit(template);
    setPromptToSave(template.prompt);
    setIsModalOpen(true);
  };

  const handleSendToAgent = (prompt: string, view: ViewType) => {
    setCurrentPrompt(prompt);
    setOptimizationSuggestions([]); // Clear suggestions when moving manually
    setActiveView(view);
  };

  const handleEvaluateAndOptimize = (prompt: string, evaluation: EvaluationResult) => {
    setCurrentPrompt(prompt);
    setOptimizationSuggestions(evaluation.suggestions);
    setActiveView(ViewType.OPTIMIZER);
  };


  const renderActiveView = () => {
    const props = {
      onSendToEnhance: (p: string) => handleSendToAgent(p, ViewType.ENHANCER),
      onSendToEvaluate: (p: string) => handleSendToAgent(p, ViewType.EVALUATOR),
      addToHistory,
      onRequestSaveTemplate: handleRequestSaveTemplate
    };

    switch (activeView) {
      case ViewType.HOME:
        return <HomePage onViewChange={handleViewChange} onSendToAgent={handleSendToAgent} templates={templates} />;
      case ViewType.CREATOR:
        return <CreatorAgent {...props} />;
      case ViewType.ENHANCER:
        return <EnhancerAgent initialPrompt={currentPrompt} {...props} />;
      case ViewType.EVALUATOR:
        return <EvaluatorAgent initialPrompt={currentPrompt} onOptimizeWithSuggestions={handleEvaluateAndOptimize} {...props} />;
      case ViewType.OPTIMIZER:
        return <OptimizerAgent initialPrompt={currentPrompt} suggestions={optimizationSuggestions} onSendToEnhance={props.onSendToEnhance} onSendToEvaluate={props.onSendToEvaluate} addToHistory={addToHistory} onRequestSaveTemplate={props.onRequestSaveTemplate} />;
      case ViewType.PLAYGROUND:
        return <PlaygroundAgent initialPrompt={currentPrompt} addToHistory={addToHistory} onRequestSaveTemplate={handleRequestSaveTemplate} />;
      case ViewType.HISTORY:
        return <HistoryPanel history={history} onRequestSaveTemplate={handleRequestSaveTemplate} />;
      case ViewType.SETTINGS:
        return <SettingsPanel clearHistory={clearHistory} />;
      case ViewType.TEMPLATES:
        return <TemplatesPanel templates={templates} deleteTemplate={deleteTemplate} onEditTemplate={handleRequestEditTemplate} onSendToAgent={handleSendToAgent} />;
      default:
        return <HomePage onViewChange={handleViewChange} onSendToAgent={handleSendToAgent} templates={templates} />;
    }
  };

  return (
    <div className="flex h-screen font-sans">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      <main className="flex-1 overflow-y-auto">
        {renderActiveView()}
      </main>
      <ToastContainer toasts={toasts} />
      {isModalOpen && promptToSave !== null && (
        <SaveTemplateModal
          prompt={promptToSave}
          initialValues={templateToEdit ? {
            name: templateToEdit.name,
            description: templateToEdit.description || '',
            tags: templateToEdit.tags || []
          } : undefined}
          onSave={handleModalSave}
          onClose={() => {
            setIsModalOpen(false);
            setTemplateToEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
