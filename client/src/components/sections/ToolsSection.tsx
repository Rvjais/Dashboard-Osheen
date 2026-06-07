import { useState } from 'react';
import { Plus, X, HelpCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import PromptDialog from '../ui/PromptDialog';
import { Tool } from '../../types';

interface ToolsSectionProps {
  tools: Tool[];
  setTools: (tools: Tool[]) => void;
}

const ToolsSection = ({ tools, setTools }: ToolsSectionProps) => {
  const categories = Array.from(new Set(tools.map(t => t.category)));
  const [toolNamePrompt, setToolNamePrompt] = useState(false);
  const [pendingToolName, setPendingToolName] = useState('');

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            🔗 Tools Hub
          </h2>
          <p className="text-sm text-gray-500 mt-1">Unified access to your professional suite and AI stack.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" size="sm" className="gap-2 text-[10px] font-bold uppercase tracking-wider" onClick={() => setToolNamePrompt(true)}><Plus size={14} /> Custom Link</Button>
        </div>
      </div>

      <div className="space-y-12">
        {categories.map(cat => (
          <div key={cat} className="space-y-6">
            <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] flex items-center gap-4">
              <span>{cat}</span>
              <div className="flex-1 h-[1px] bg-gray-200" />
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {tools.filter(t => t.category === cat).map(tool => (
                <div key={tool.id} className="relative group">
                  {tool.category === 'Custom Tools' && (
                    <button onClick={() => setTools(tools.filter(t => t.id !== tool.id))} className="absolute top-2 right-2 z-10 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X size={12} /></button>
                  )}
                  <a 
                    href={tool.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-8 bg-white border border-gray-100 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-brand-accent/30 hover:shadow-2xl hover:shadow-brand-accent/5 transition-all duration-500 transform hover:-translate-y-2"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-4xl group-hover:bg-brand-accent/5 group-hover:scale-110 transition-all duration-500 shadow-inner group-hover:rotate-6 overflow-hidden">
                      {typeof tool.icon === 'string' && tool.icon.startsWith('http') ? <img src={tool.icon} alt="logo" className="w-8 h-8 object-contain" /> : tool.icon}
                    </div>
                    <span className="text-xs font-bold text-gray-900 group-hover:text-brand-accent transition-colors tracking-tight text-center">{tool.name}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-brand-accent h-1 w-4 rounded-full mx-auto" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12 border-t border-gray-100">
          <Card className="lg:col-span-3 bg-brand-sidebar text-white p-10 border-none overflow-hidden relative">
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full translate-x-1/2 translate-y-1/2" />
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20"><HelpCircle size={24} /></div>
                   <h3 className="text-2xl font-display font-bold">Integrating New Assets</h3>
                </div>
                <p className="text-gray-400 text-sm max-w-lg leading-relaxed">Need more tools? You can integrate custom cloud links or request new platform integrations through the security portal.</p>
                <div className="flex gap-4">
                   <Button variant="ghost" className="text-white hover:bg-white/10 text-xs font-bold tracking-widest uppercase">Safety Documentation</Button>
                   <Button className="bg-white text-brand-sidebar hover:bg-gray-100 text-xs font-bold tracking-widest uppercase">Request Integration</Button>
                </div>
             </div>
          </Card>
        </div>
      </div>

      <PromptDialog
        open={toolNamePrompt}
        onClose={() => setToolNamePrompt(false)}
        onSubmit={(name) => {
          setPendingToolName(name);
          const url = prompt("Enter tool URL (https://...):");
          if (url) {
            let domain = url;
            try {
              domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
            } catch (e) {}
            const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            setTools([...tools, { id: crypto.randomUUID(), name, url, icon: iconUrl, category: 'Custom Tools' }]);
          }
        }}
        title="Add Custom Tool"
        placeholder="Enter tool name..."
      />
    </div>
  );
};

export default ToolsSection;
