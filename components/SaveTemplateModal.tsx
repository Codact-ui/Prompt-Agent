
import React, { useState, useEffect, useRef } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface SaveTemplateModalProps {
  prompt: string;
  initialValues?: {
    name: string;
    description: string;
    tags: string[];
  };
  onSave: (name: string, prompt: string, description: string, tags: string[]) => void;
  onClose: () => void;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ prompt, initialValues, onSave, onClose }) => {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [tags, setTags] = useState(initialValues?.tags.join(', ') || '');
  const [currentPrompt, setCurrentPrompt] = useState(prompt);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!initialValues;

  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.focus();
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      onSave(name.trim(), currentPrompt, description.trim(), tagArray);
    }
  };

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-lg modal-content-in">
        <form onSubmit={handleSave}>
            <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-notion-text">{isEdit ? 'Edit Template' : 'Save to Library'}</h3>
                
                <div>
                    <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                    <Input
                        ref={inputRef}
                        id="template-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Marketing Slogan Generator"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="template-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <Input
                        id="template-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Briefly describe what this prompt does..."
                    />
                </div>

                <div>
                    <label htmlFor="template-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                    <Input
                        id="template-tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="marketing, email, v1 (comma separated)"
                    />
                </div>
                
                {isEdit ? (
                    <div>
                        <label htmlFor="template-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt</label>
                        <textarea 
                             id="template-prompt"
                             className="flex min-h-[80px] w-full rounded-md border border-notion-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-notion-accent dark:text-gray-200"
                             value={currentPrompt} 
                             onChange={(e) => setCurrentPrompt(e.target.value)}
                        />
                    </div>
                ) : (
                    <div className="bg-notion-bg/50 p-3 rounded-md border border-notion-border">
                        <p className="text-xs text-gray-500 font-mono line-clamp-3">{currentPrompt}</p>
                    </div>
                )}

            </div>
            <div className="flex justify-end space-x-2 p-4 bg-notion-bg/50 border-t border-notion-border rounded-b-lg">
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!name.trim()}>
                    {isEdit ? 'Update Template' : 'Save Template'}
                </Button>
            </div>
        </form>
      </Card>
    </Modal>
  );
};

export default SaveTemplateModal;
