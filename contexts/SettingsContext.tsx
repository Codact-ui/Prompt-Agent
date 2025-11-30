
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AppSettings } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  importData: (json: string) => boolean;
  exportData: () => string;
}

const DEFAULT_RUBRIC = "Clarity, Specificity, Safety, Testability, Efficiency";

const DEFAULT_SETTINGS: AppSettings = {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    customEvaluationRubric: DEFAULT_RUBRIC
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
        const storedSettings = localStorage.getItem('appSettings');
        if (storedSettings) {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
      setSettings(prev => {
          const updated = { ...prev, ...newSettings };
          localStorage.setItem('appSettings', JSON.stringify(updated));
          return updated;
      });
  };

  const exportData = () => {
      const history = localStorage.getItem('promptHistory');
      const templates = localStorage.getItem('promptTemplates');
      const appSettings = localStorage.getItem('appSettings');
      
      const exportObj = {
          history: history ? JSON.parse(history) : [],
          templates: templates ? JSON.parse(templates) : [],
          settings: appSettings ? JSON.parse(appSettings) : DEFAULT_SETTINGS,
          version: 1,
          timestamp: new Date().toISOString()
      };
      
      return JSON.stringify(exportObj, null, 2);
  };

  const importData = (json: string) => {
      try {
          const data = JSON.parse(json);
          if (data.history) localStorage.setItem('promptHistory', JSON.stringify(data.history));
          if (data.templates) localStorage.setItem('promptTemplates', JSON.stringify(data.templates));
          if (data.settings) {
              localStorage.setItem('appSettings', JSON.stringify(data.settings));
              setSettings(data.settings);
          }
          // Force reload to apply changes to other contexts/states via page refresh or state lift (page refresh is safer for full restore)
          return true;
      } catch (e) {
          console.error("Import failed", e);
          return false;
      }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, importData, exportData }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
