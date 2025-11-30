
import React from 'react';
import { ViewType, TemplateItem } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { CreateIcon, EnhanceIcon, EvaluateIcon, OptimizeIcon, PlayIcon } from './icons/AgentIcons';

interface HomePageProps {
    onViewChange: (view: ViewType) => void;
    onSendToAgent: (prompt: string, view: ViewType) => void;
    templates: TemplateItem[];
}

const AGENT_CARDS = [
  { 
    name: 'Create', 
    description: 'Generate a structured prompt from a simple goal.',
    icon: <CreateIcon />,
    view: ViewType.CREATOR,
  },
  { 
    name: 'Enhance', 
    description: 'Refine a prompt into a block-based format for clarity.',
    icon: <EnhanceIcon />,
    view: ViewType.ENHANCER,
  },
  { 
    name: 'Evaluate', 
    description: 'Score your prompt against key metrics and identify risks.',
    icon: <EvaluateIcon />,
    view: ViewType.EVALUATOR,
  },
  { 
    name: 'Optimize', 
    description: 'Evolve your prompt with AI-driven suggestions.',
    icon: <OptimizeIcon />,
    view: ViewType.OPTIMIZER,
  },
  {
    name: 'Playground',
    description: 'Test prompts with variables and real-time output.',
    icon: <PlayIcon />,
    view: ViewType.PLAYGROUND
  }
];


const HomePage: React.FC<HomePageProps> = ({ onViewChange, onSendToAgent, templates }) => {
    
    const recentTemplates = templates.slice(0, 3);

    return (
        <div className="max-w-5xl mx-auto p-8 lg:p-12">
            <header className="text-center border-b border-notion-border pb-10">
                <h1 className="text-5xl font-bold tracking-tight text-notion-text">
                    Welcome to Prompt Agent
                </h1>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    An intelligent workspace for iteratively creating, enhancing, and optimizing your prompts.
                </p>
                <div className="mt-8">
                    <Button size="default" onClick={() => onViewChange(ViewType.CREATOR)}>
                        Start New Workflow
                    </Button>
                </div>
            </header>
            
            <section className="mt-12">
                 <h2 className="text-2xl font-semibold text-center mb-8">Meet Your Agents</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {AGENT_CARDS.map(agent => (
                        <Card key={agent.name} className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewChange(agent.view)}>
                           <div className="w-10 h-10 mx-auto mb-4 opacity-80 text-notion-text">{agent.icon}</div>
                           <h3 className="font-semibold">{agent.name}</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{agent.description}</p>
                        </Card>
                    ))}
                 </div>
            </section>

            <section className="mt-16">
                 <h2 className="text-2xl font-semibold text-center mb-8">Recent Templates</h2>
                 {recentTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recentTemplates.map(template => (
                            <Card key={template.id} className="flex flex-col">
                                <div className="p-4 flex-grow">
                                    <h3 className="font-semibold truncate">{template.name}</h3>
                                    <p className="text-xs text-gray-400 mb-2">{new Date(template.timestamp).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-500 line-clamp-3">{template.prompt}</p>
                                </div>
                                <div className="p-2 border-t border-notion-border">
                                    <Button variant="secondary" size="sm" className="w-full" onClick={() => onSendToAgent(template.prompt, ViewType.ENHANCER)}>
                                        Use Template
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                 ) : (
                    <Card className="text-center p-10">
                        <p className="text-gray-500">You have no saved templates yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Save a prompt in any agent to see it here.</p>
                    </Card>
                 )}
            </section>

        </div>
    );
};

export default HomePage;
