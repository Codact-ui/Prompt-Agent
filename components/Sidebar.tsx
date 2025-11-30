
import React, { useState } from 'react';
import { ViewType } from '../types';
import { CreateIcon, EnhanceIcon, EvaluateIcon, OptimizeIcon, MenuIcon, ChevronLeftIcon, HistoryIcon, SettingsIcon, TemplatesIcon, HomeIcon, PlayIcon } from './icons/AgentIcons';
import NavButton from './NavButton';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const AGENT_CONFIG = [
  { id: ViewType.CREATOR, name: 'Create', icon: <CreateIcon /> },
  { id: ViewType.ENHANCER, name: 'Enhance', icon: <EnhanceIcon /> },
  { id: ViewType.EVALUATOR, name: 'Evaluate', icon: <EvaluateIcon /> },
  { id: ViewType.OPTIMIZER, name: 'Optimize', icon: <OptimizeIcon /> },
  { id: ViewType.PLAYGROUND, name: 'Playground', icon: <PlayIcon /> },
];

const TOOLS_CONFIG = [
  { id: ViewType.TEMPLATES, name: 'Templates', icon: <TemplatesIcon /> },
  { id: ViewType.HISTORY, name: 'History', icon: <HistoryIcon /> },
  { id: ViewType.SETTINGS, name: 'Settings', icon: <SettingsIcon /> },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`transition-all duration-300 ease-in-out bg-notion-bg/80 border-r border-notion-border flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 h-16 border-b border-notion-border">
        {!isCollapsed && <h1 className="font-bold text-lg">Prompt Agent</h1>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded hover:bg-notion-hover" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {isCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-4">
        <div>
          <div className="space-y-1">
             <NavButton 
                view={ViewType.HOME} 
                name="Home" 
                icon={<HomeIcon />} 
                activeView={activeView}
                isCollapsed={isCollapsed}
                onViewChange={onViewChange}
             />
          </div>
        </div>
        <div>
          <h2 className={`px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${isCollapsed ? 'text-center' : ''}`}>Agents</h2>
          <div className="mt-1 space-y-1">
            {AGENT_CONFIG.map((agent) => (
                <NavButton 
                    key={agent.id} 
                    view={agent.id} 
                    name={agent.name} 
                    icon={agent.icon} 
                    activeView={activeView}
                    isCollapsed={isCollapsed}
                    onViewChange={onViewChange}
                />
            ))}
          </div>
        </div>
        <div>
          <h2 className={`px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${isCollapsed ? 'text-center' : ''}`}>Tools</h2>
          <div className="mt-1 space-y-1">
            {TOOLS_CONFIG.map((tool) => (
                <NavButton 
                    key={tool.id} 
                    view={tool.id} 
                    name={tool.name} 
                    icon={tool.icon}
                    activeView={activeView}
                    isCollapsed={isCollapsed}
                    onViewChange={onViewChange}
                />
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
