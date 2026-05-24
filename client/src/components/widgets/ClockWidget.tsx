import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { User } from '../../types';
import Card from '../ui/Card';

interface ClockWidgetProps {
  currentTime: Date;
  team: User[];
}

const ClockWidget = ({ currentTime, team }: ClockWidgetProps) => (
  <Card className="bg-white border-gray-200 flex flex-col items-center justify-center text-center p-8 h-full">
    <div className="text-gray-400 mb-2">
       <Clock size={24} />
    </div>
    <div className="text-4xl font-mono font-bold text-gray-900 tracking-tighter">
      {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
    </div>
    <div className="text-xs font-bold text-brand-accent mt-2 uppercase tracking-widest">
      {format(currentTime, 'EEE, MMM d')}
    </div>
    <div className="mt-6 flex flex-wrap gap-2 justify-center">
      {team.slice(0, 3).map((m: User) => (
        <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: m.avatarColor }}>
          {m.name.charAt(0)}
        </div>
      ))}
      {team.length > 3 && (
        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm">
          +{team.length - 3}
        </div>
      )}
    </div>
  </Card>
);

export default ClockWidget;
