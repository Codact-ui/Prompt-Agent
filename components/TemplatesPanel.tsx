
import React, { useState, useMemo } from 'react';
import { TemplateItem, ViewType } from '../types';
import Header from './Header';
import { TemplatesIcon, CopyIcon, TrashIcon, CreateIcon, PlayIcon, SortIcon, EditIcon, SearchIcon } from './icons/AgentIcons';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import useCopyToClipboard from '../hooks/useCopyToClipboard';

interface TemplateCardProps {
    template: TemplateItem;
    onDelete: (id: string) => void;
    onEdit: (template: TemplateItem) => void;
    onSendToAgent: (prompt: string, view: ViewType) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onDelete, onEdit, onSendToAgent }) => {
    const { copy, isCopied } = useCopyToClipboard();
    
    return (
        <Card className="flex flex-col group relative">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-notion-text text-lg pr-4">{template.name}</h3>
                    {template.variables && template.variables.length > 0 && (
                         <span className="text-[10px] bg-notion-accent/10 text-notion-accent px-2 py-0.5 rounded-full font-medium shrink-0">
                            {template.variables.length} var{template.variables.length !== 1 && 's'}
                         </span>
                    )}
                </div>
                
                {template.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-2 line-clamp-2">{template.description}</p>
                )}

                <div className="flex flex-wrap gap-1 mt-2 mb-3">
                    {template.tags && template.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                            #{tag}
                        </span>
                    ))}
                </div>

                <p className="text-xs text-gray-400 mb-2 font-mono bg-notion-bg/50 p-2 rounded line-clamp-3">
                    {template.prompt}
                </p>
                
                <p className="text-[10px] text-gray-400 mt-2">
                    Last edited: {new Date(template.timestamp).toLocaleDateString()}
                </p>
            </div>

            <div className="p-3 border-t border-notion-border bg-notion-bg/30 flex items-center justify-between gap-2">
                 <div className="flex space-x-2">
                    <Button onClick={() => onSendToAgent(template.prompt, ViewType.PLAYGROUND)} variant="secondary" size="sm" className="h-8 text-xs px-2" title="Test in Playground">
                        <PlayIcon className="w-3 h-3 mr-1" /> Test
                    </Button>
                    <Button onClick={() => onSendToAgent(template.prompt, ViewType.ENHANCER)} variant="secondary" size="sm" className="h-8 text-xs px-2" title="Use in Enhancer">
                        Use
                    </Button>
                 </div>
                <div className="flex items-center">
                     <Button onClick={() => onEdit(template)} variant="ghost" size="icon" className="h-8 w-8" title="Edit Template"><EditIcon className="w-4 h-4"/></Button>
                    <Button onClick={() => copy(template.prompt)} variant="ghost" size="icon" className="h-8 w-8" title="Copy"><CopyIcon className="w-4 h-4"/></Button>
                    <Button onClick={() => onDelete(template.id)} variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" title="Delete"><TrashIcon className="w-4 h-4"/></Button>
                </div>
            </div>
            {isCopied && <div className="absolute top-0 right-0 m-2 text-xs bg-green-500 text-white px-2 py-1 rounded shadow-md z-10">Copied!</div>}
        </Card>
    );
};

interface TemplatesPanelProps {
    templates: TemplateItem[];
    deleteTemplate: (id: string) => void;
    onEditTemplate: (template: TemplateItem) => void;
    onSendToAgent: (prompt: string, view: ViewType) => void;
}

type SortOption = 'newest' | 'oldest' | 'az' | 'za';

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ templates, deleteTemplate, onEditTemplate, onSendToAgent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [templates]);

  const processedTemplates = useMemo(() => {
      // 1. Filter
      let result = templates.filter(t => {
          const matchesSearch = 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
          
          const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => t.tags?.includes(tag));
          
          return matchesSearch && matchesTags;
      });

      // 2. Sort
      result = result.sort((a, b) => {
          switch (sortOrder) {
              case 'newest': return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
              case 'oldest': return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
              case 'az': return a.name.localeCompare(b.name);
              case 'za': return b.name.localeCompare(a.name);
              default: return 0;
          }
      });

      return result;
  }, [templates, searchQuery, selectedTags, sortOrder]);

  const toggleTag = (tag: string) => {
      setSelectedTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <Header
        icon={<TemplatesIcon />}
        title="Prompt Library"
        description="Organize, search, and manage your collection of high-quality prompts."
      />
      
      <div className="mt-8 flex flex-col gap-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-grow flex flex-col sm:flex-row gap-4">
                 <div className="w-full sm:w-96 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input 
                        placeholder="Search templates..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white dark:bg-black/20 pl-10"
                    />
                </div>
                <div className="flex items-center space-x-2 bg-white dark:bg-black/20 rounded-md border border-notion-border px-3">
                    <SortIcon className="w-4 h-4 text-gray-400" />
                    <select 
                        className="bg-transparent text-sm py-2 focus:outline-none dark:text-gray-200"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as SortOption)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="az">Name (A-Z)</option>
                        <option value="za">Name (Z-A)</option>
                    </select>
                </div>
            </div>
            <div className="text-sm text-gray-500 whitespace-nowrap">
                {processedTemplates.length} template{processedTemplates.length !== 1 && 's'} found
            </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Filter by:</span>
                {allTags.map(tag => (
                    <button 
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                            selectedTags.includes(tag) 
                            ? 'bg-notion-text text-white border-notion-text' 
                            : 'bg-transparent text-gray-600 border-gray-300 hover:border-gray-400 dark:text-gray-300 dark:border-gray-600'
                        }`}
                    >
                        {tag}
                    </button>
                ))}
                {selectedTags.length > 0 && (
                    <button onClick={() => setSelectedTags([])} className="text-xs text-red-500 hover:underline ml-2">Clear filters</button>
                )}
            </div>
        )}

        {/* Grid */}
        <div className="mt-4">
            {processedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {processedTemplates.map(t => (
                        <TemplateCard key={t.id} template={t} onDelete={deleteTemplate} onEdit={onEditTemplate} onSendToAgent={onSendToAgent} />
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="p-16 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-notion-bg rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <TemplatesIcon />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No templates found</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                            {templates.length === 0 
                                ? "You haven't saved any prompts yet. Use the Creator Agent to generate your first prompt." 
                                : "Try adjusting your search or filters to find what you're looking for."}
                        </p>
                         {templates.length === 0 && (
                            <Button onClick={() => onSendToAgent('', ViewType.CREATOR)} className="mt-6">
                                <CreateIcon className="w-4 h-4 mr-2"/>
                                Go to Creator
                            </Button>
                         )}
                    </div>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
};

export default TemplatesPanel;
