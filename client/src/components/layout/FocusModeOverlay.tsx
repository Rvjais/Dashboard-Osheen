import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play } from 'lucide-react';
import Button from '../ui/Button';

interface FocusMode {
  active: boolean;
  taskName: string;
  duration: number;
  timeLeft: number;
  timerActive: boolean;
}

interface FocusModeOverlayProps {
  focusMode: FocusMode | null;
  setFocusMode: (v: FocusMode | null) => void;
}

const FocusModeOverlay = ({ focusMode, setFocusMode }: FocusModeOverlayProps) => {
  return (
    <AnimatePresence>
      {focusMode?.active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-brand-sidebar text-white p-20 flex flex-col items-center justify-center text-center overflow-hidden"
        >
          <div className="absolute top-10 right-10">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setFocusMode(null)}>
              <X size={32} />
            </Button>
          </div>

          <div className="space-y-4 mb-20 animate-pulse">
            <p className="text-gray-500 uppercase tracking-[0.5em] text-xs font-bold font-mono">Focusing on</p>
            <h2 className="text-6xl font-display font-bold leading-tight max-w-2xl">{focusMode.taskName}</h2>
          </div>

          <div className="text-[180px] font-mono font-medium tracking-tighter leading-none mb-20">
            {Math.floor(focusMode.timeLeft / 60)}:{String(focusMode.timeLeft % 60).padStart(2, '0')}
          </div>

          <div className="w-full max-w-3xl space-y-8">
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand-accent shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                initial={{ width: '100%' }}
                animate={{ width: `${(focusMode.timeLeft / (focusMode.duration * 60)) * 100}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            <div className="flex gap-6 justify-center">
              <button
                onClick={() => setFocusMode({ ...focusMode, timerActive: !focusMode.timerActive })}
                className="w-20 h-20 rounded-full bg-white text-brand-sidebar flex items-center justify-center hover:scale-105 transition-transform"
              >
                {focusMode.timerActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FocusModeOverlay;
