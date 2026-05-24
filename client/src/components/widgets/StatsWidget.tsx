import { CheckCircle2, Clock, BarChart2, Brain } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';
import Card from '../ui/Card';
import { Task, MeetingNote, Idea } from '../../types';

interface StatsWidgetProps {
  tasks: Task[];
  meetingNotes: MeetingNote[];
  ideas: Idea[];
}

const StatsWidget = ({ tasks, meetingNotes, ideas }: StatsWidgetProps) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
    {[
      { label: 'Tasks Due', value: tasks.filter((t: Task) => !t.done).length, color: 'bg-rose-50 text-rose-600', icon: CheckCircle2 },
      { label: 'Meetings Today', value: meetingNotes.filter((n: MeetingNote) => isToday(parseISO(n.date))).length, color: 'bg-blue-50 text-blue-600', icon: Clock },
      { label: 'Done This Week', value: tasks.filter((t: Task) => t.done).length, color: 'bg-emerald-50 text-emerald-600', icon: BarChart2 },
      { label: 'Ideas Captured', value: ideas.length, color: 'bg-amber-50 text-amber-600', icon: Brain },
    ].map(stat => (
      <Card key={stat.label} className="p-4 flex-row items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color)}>
          <stat.icon size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
          <p className="text-xl font-display font-bold text-gray-900">{stat.value}</p>
        </div>
      </Card>
    ))}
  </div>
);

export default StatsWidget;
