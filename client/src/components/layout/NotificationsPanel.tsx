import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertCircle, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

interface Notification {
  id: string;
  title: string;
  time: string;
  msg: string;
  type: string;
}

interface NotificationsPanelProps {
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
  notifs: Notification[];
}

const NotificationsPanel = ({ showNotifications, setShowNotifications, notifs }: NotificationsPanelProps) => {
  return (
    <AnimatePresence>
      {showNotifications && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNotifications(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-[360px] bg-white shadow-2xl z-[70] p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-display font-bold">Notifications</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}><X size={20} /></Button>
            </div>

            <div className="space-y-4">
              {notifs.map(n => (
                <div key={n.id} className="p-4 rounded-2xl bg-gray-50 flex items-start gap-3 border border-gray-100 hover:border-brand-accent/30 transition-all cursor-pointer">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                    n.type === 'meeting' ? 'bg-blue-100 text-blue-600' :
                    n.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  )}>
                    {n.type === 'meeting' ? <Clock size={16} /> : n.type === 'alert' ? <AlertCircle size={16} /> : <Brain size={16} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-gray-900">{n.title}</p>
                      <span className="text-[10px] text-gray-400 font-mono">{n.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">{n.msg}</p>
                  </div>
                </div>
              ))}
              <div className="pt-8 text-center">
                <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => setShowNotifications(false)}>CLOSE</Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
