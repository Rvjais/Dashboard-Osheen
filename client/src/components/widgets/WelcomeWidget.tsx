import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import Card from '../ui/Card';
import { User } from '../../types';

interface WelcomeWidgetProps {
  session: { user: User } | null;
  dailyBrief: string;
  updateMood: (mood: string) => void;
  dayScore: number;
}

const MOOD_LIST = ['🔥', '🎯', '🌱', '⚡', '☕', '😴'];

const WelcomeWidget = ({ session, dailyBrief, updateMood, dayScore }: WelcomeWidgetProps) => (
  <Card className="bg-brand-sidebar text-white p-8 border-none overflow-hidden relative min-h-[220px] h-full">
    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 blur-3xl -translate-y-1/2 translate-x-1/3 rounded-full" />
    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 h-full">
      <div className="space-y-4 max-w-lg">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Good morning, {session?.user?.name || 'there'}!</h1>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">{dailyBrief}</p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">How's your mood today?</p>
          <div className="flex gap-2">
            {MOOD_LIST.map(m => (
              <button 
                key={m} 
                onClick={() => updateMood(m)}
                className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110", session?.user?.mood === m ? "bg-white/20 ring-2 ring-brand-accent" : "bg-white/5 hover:bg-white/10")}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center md:items-end gap-2 px-4 py-3 bg-white/5 rounded-2xl backdrop-blur-sm self-start md:self-center">
        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Productivity Score</span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-display font-bold text-brand-accent">{dayScore}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
          <motion.div initial={{ width: 0 }} animate={{ width: `${dayScore}%` }} className="h-full bg-brand-accent" />
        </div>
      </div>
    </div>
  </Card>
);

export default WelcomeWidget;
