import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import AlertDialog from '../ui/AlertDialog';
import { TaskPriority, Task } from '../../types';
import { analyzeBrainDump } from '../../services/geminiService';

interface BrainDumpSectionProps {
  brainDump: string;
  setBrainDump: (value: string) => void;
  currentTime: Date;
  setTasks: (tasks: Task[]) => void;
  tasks: Task[];
  session: { user: { id: string } };
}

const BrainDumpSection = ({ brainDump, setBrainDump, currentTime, setTasks, tasks, session }: BrainDumpSectionProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [captureAlert, setCaptureAlert] = useState(false);

  const handleAIAnalyze = async () => {
    if (!brainDump.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeBrainDump(brainDump);
      setAiResult(result);
    } catch (err: any) {
      setAiResult("AI Error: " + (err.message || String(err)));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
  <div className="h-full flex flex-col gap-6">
     <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-display font-bold flex items-center gap-3">
          🧠 Brain Dump
        </h2>
        <p className="text-sm text-gray-500 mt-1">Your daily ephemeral scratchpad. Clears at midnight.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" className="gap-2" onClick={handleAIAnalyze} disabled={analyzing}>
          {analyzing ? <div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-brand-accent rounded-full" /> : <Wand2 size={14} />}
          AI Insights
        </Button>
        <Button 
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => {
            const firstLine = brainDump.split('\n')[0];
            if (firstLine) {
               setTasks([{ id: crypto.randomUUID(), title: firstLine, priority: TaskPriority.MEDIUM, assigneeId: session?.user.id || '', done: false, dueDate: format(new Date(), 'yyyy-MM-dd') }, ...tasks]);
               setCaptureAlert(true);
            }
          }}
        >→ Convert to Task</Button>
      </div>
    </div>

    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 flex flex-col gap-4">
        <textarea 
          className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-8 focus:outline-none focus:ring-2 ring-brand-accent/20 text-lg font-medium leading-relaxed resize-none shadow-sm"
          placeholder="Start typing your thoughts here... no rules, just release."
          value={brainDump}
          onChange={(e) => {
            setBrainDump(e.target.value);
            localStorage.setItem('taskstudio_braindump', e.target.value);
          }}
        />
        <div className="flex justify-between items-center p-2">
          <div className="flex gap-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            <span>Words: {brainDump.split(/\s+/).filter(Boolean).length}</span>
            <span>Chars: {brainDump.length}</span>
            <span>Last saved: {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
          </div>
          <div className="flex gap-2">
            {['What is the most important thing to accomplish today?', 'How are you feeling about your current workload?', 'List three things you are grateful for.'].slice(0, 3).map(p => (
              <button 
                key={p} 
                onClick={() => setBrainDump(brainDump + (brainDump ? '\n\n' : '') + p)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] text-gray-600 transition-colors"
              >
                {p.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card title="Sentiment Analysis">
          <div className="flex items-center gap-4 py-4">
            <div className="text-4xl">
               {brainDump.length === 0 ? '😶' : brainDump.length > 100 ? '🔥' : '🌱'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Energy Level</p>
              <p className="text-xs text-gray-500">Based on content volume.</p>
            </div>
          </div>
        </Card>
        <Card title="Writing Stats">
          <div className="py-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Current words</span>
              <span className="font-mono text-gray-400">{brainDump.split(/\s+/).filter(Boolean).length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Characters</span>
              <span className="font-mono text-gray-400">{brainDump.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <AlertDialog
      open={!!aiResult}
      onClose={() => setAiResult(null)}
      title="AI Insights"
      message={aiResult || ''}
      variant="info"
    />

    <AlertDialog
      open={captureAlert}
      onClose={() => setCaptureAlert(false)}
      title="Task Captured"
      message="Captured as task!"
      variant="success"
    />
  </div>
  );
};

export default BrainDumpSection;
