import React from 'react';
import { ViewType } from '../types';

interface NavButtonProps {
    view: ViewType;
    name: string;
    icon: React.ReactNode;
    activeView: ViewType;
    isCollapsed: boolean;
    onViewChange: (view: ViewType) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ view, name, icon, activeView, isCollapsed, onViewChange }) => (
    <button
      onClick={() => onViewChange(view)}
      className={`w-full flex items-center p-2 rounded-md text-sm transition-colors ${
        activeView === view ? 'bg-notion-hover text-notion-text' : 'hover:bg-notion-hover text-gray-500 dark:text-gray-400'
      } ${isCollapsed ? 'justify-center' : ''}`}
      aria-label={name}
      title={name}
    >
      <div className="w-5 h-5">{icon}</div>
      {!isCollapsed && <span className="ml-3">{name}</span>}
    </button>
);

export default NavButton;
