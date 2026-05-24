import { Brain } from 'lucide-react';
import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PromptDialog from '../ui/PromptDialog';
import { Idea } from '../../types';

interface IdeasWidgetProps {
  ideas: Idea[];
  setIdeas: (ideas: Idea[]) => void;
}

const IdeasWidget = ({ ideas, setIdeas }: IdeasWidgetProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const randomIdea = ideas.length > 0 ? ideas[Math.floor(Math.random() * ideas.length)] : null;

  return (
    <>
      <Card title="Idea of the Day" className="bg-brand-accent/5 border-brand-accent/20 h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Brain size={48} className="text-brand-accent mb-4 opacity-20" />
          <p className="text-sm font-medium italic text-gray-700 leading-relaxed">
            {randomIdea ? `"${randomIdea.text}"` : "No ideas yet. Brainstorming session?"}
          </p>
        </div>
        <Button variant="secondary" className="w-full gap-2 group" onClick={() => setShowPrompt(true)}>
          <Brain size={16} className="group-hover:rotate-12 transition-transform" />
          Record New Idea
        </Button>
      </Card>
      <PromptDialog
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
        onSubmit={(value) => {
          setIdeas([...ideas, { id: Date.now().toString(), text: value, category: 'General', date: new Date().toISOString() }]);
        }}
        title="New Idea"
        placeholder="Enter your idea..."
      />
    </>
  );
};

export default IdeasWidget;
