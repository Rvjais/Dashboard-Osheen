import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Send } from 'lucide-react';
import { Section } from '../types';
import { cn } from '../lib/utils';
import Button from './ui/Button';
import { chatWithAI } from '../services/geminiService';

interface AIAssistantProps {
  onClose: () => void;
  currentSection: Section;
}

const AIAssistant = ({ onClose, currentSection }: AIAssistantProps) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  const getSuggestions = () => {
    switch (currentSection) {
      case Section.HOME:
        return ['Analyze workspace efficiency', 'Give me a daily focus strategy', 'How can I improve my score?'];
      case Section.TRACKER:
        return ['Summarize active projects', 'Identify overdue deliverables', 'Analyze team workload distribution'];
      case Section.CALENDAR:
        return ['Summarize next month highlights', 'Optimize publishing schedule', 'Ideate content for LinkedIn'];
      case Section.TEAM:
        return ['Summarize team performance', 'Draft a team-wide update', 'Suggest 1-on-1 topics'];
      case Section.MEETINGS:
        return ['Summarize latest meeting notes', 'Extract action items from meetings', 'Draft follow-up email'];
      case Section.REPORTS:
        return ['Analyze productivity trends', 'Predict next month output', 'Generate executive summary'];
      case Section.TOOLS:
        return ['Suggest workflow automations', 'Audit my tool stack', 'New app recommendation'];
      default:
        return ['Summarize my tasks', 'Motivation boost', 'Brainstorm ideas'];
    }
  };

  const suggestions = getSuggestions();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages([...messages, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithAI({ prompt: userMsg });
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      setApiAvailable(true);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', content: "AI Companion is not available. The Gemini API key is not configured. Ask your admin to set up GEMINI_API_KEY in the server .env file." }]);
      setApiAvailable(false);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[120] flex flex-col"
    >
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-brand-sidebar text-white shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
            <Sparkles size={20} className="text-brand-accent animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">AI Companion</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", apiAvailable === false ? 'bg-red-500' : 'bg-brand-accent animate-ping')} />
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{apiAvailable === false ? 'Unavailable' : apiAvailable === null ? 'Ready' : 'Active'}</p>
              </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 rounded-xl" onClick={onClose}><X size={20} /></Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="w-20 h-20 rounded-[40px] bg-white shadow-xl border border-gray-100 flex items-center justify-center mx-auto text-4xl mb-6 transform hover:rotate-12 transition-transform">🤖</div>
            <h4 className="text-lg font-display font-bold text-gray-900 mb-2">Hello, I'm Gemini.</h4>
            <p className="text-xs text-gray-500 max-w-[240px] mx-auto leading-relaxed">I can help you analyze tasks, summarize meetings, or just brainstorm your next big idea.</p>
            
            <div className="mt-8 grid grid-cols-1 gap-2 px-4">
               {suggestions.map(suggestion => (
                 <button 
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="p-3 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:border-brand-accent hover:text-brand-accent transition-all text-left uppercase tracking-wider relative group overflow-hidden"
                 >
                   <div className="absolute inset-y-0 left-0 w-0 group-hover:w-1 bg-brand-accent transition-all" />
                   {suggestion}
                 </button>
               ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn("max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm", 
              m.role === 'user' ? 'bg-brand-accent text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
            )}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none flex gap-1.5 shadow-sm">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
             </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-100 bg-white">
        <div className="relative flex items-end gap-2 group">
          <textarea 
            rows={2}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 pr-12 text-sm focus:ring-2 ring-brand-accent/10 focus:bg-white outline-none resize-none transition-all"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <button 
            disabled={!input.trim() || isTyping}
            onClick={sendMessage}
            className="w-12 h-12 rounded-2xl bg-brand-sidebar text-white flex items-center justify-center hover:bg-black disabled:opacity-50 disabled:grayscale transition-all shadow-xl active:scale-90"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-4 font-medium uppercase tracking-[0.2em]">Contextual Workspace Intelligence</p>
      </div>
    </motion.div>
  );
};

export default AIAssistant;
