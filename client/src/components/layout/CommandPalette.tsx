import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Section } from '../../types';

interface CommandPaletteProps {
  showCommandPalette: boolean;
  setShowCommandPalette: (v: boolean) => void;
  setCurrentSection: (s: Section) => void;
  onStartFocus: () => void;
  onLogout: () => void;
}

interface Command {
  cmd: string;
  desc: string;
  section?: Section;
  action?: () => void;
}

const CommandPalette = ({ showCommandPalette, setShowCommandPalette, setCurrentSection, onStartFocus, onLogout }: CommandPaletteProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const commands: Command[] = [
    { cmd: '/task', desc: 'Create a new task', section: Section.TRACKER },
    { cmd: '/idea', desc: 'Capture a quick idea', section: Section.HOME },
    { cmd: '/tracker', desc: 'Add row to Daily Tracker', section: Section.TRACKER },
    { cmd: '/meeting', desc: 'Start meeting note', section: Section.MEETINGS },
    { cmd: '/braindump', desc: 'Switch to Brain Dump', section: Section.BRAINDUMP },
    { cmd: '/focus', desc: 'Start a focus session', action: onStartFocus },
    { cmd: '/logout', desc: 'Securely exit current session', action: onLogout },
  ];

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;
    const q = searchQuery.toLowerCase();
    return commands.filter(c => c.cmd.includes(q) || c.desc.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <AnimatePresence>
      {showCommandPalette && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommandPalette(false)}
            className="absolute inset-0 bg-brand-sidebar/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="bg-gray-100 px-2 py-1 rounded text-[10px] font-mono font-bold text-gray-400">/</div>
              <input
                autoFocus
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 font-medium placeholder-gray-400"
                placeholder="Search commands (task, idea, meeting, focus)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">Press Esc to close</div>
            </div>
            <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
              {filteredCommands.map(c => (
                <button
                  key={c.cmd}
                  onClick={() => {
                    if (c.action) c.action();
                    if (c.section) setCurrentSection(c.section);
                    setShowCommandPalette(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-brand-accent">{c.cmd}</span>
                    <span className="text-sm text-gray-500">{c.desc}</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
