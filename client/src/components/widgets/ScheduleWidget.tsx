import Card from '../ui/Card';
import { MeetingNote, Task } from '../../types';

interface ScheduleWidgetProps {
  meetingNotes: MeetingNote[];
  tasks: Task[];
}

const ScheduleWidget = ({ meetingNotes, tasks }: ScheduleWidgetProps) => {
  const todayItems = [
    ...meetingNotes.filter((m: MeetingNote) => new Date(m.date).toDateString() === new Date().toDateString()).map((m: MeetingNote) => ({ time: new Date(m.date), label: `Meeting: ${m.title}`, type: 'meeting' })),
    ...tasks.filter((t: Task) => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()).map((t: Task) => ({ time: new Date(t.dueDate), label: `Task Due: ${t.title}`, type: 'task' }))
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  return (
    <Card title="Today's Schedule" subtitle={todayItems.length > 0 ? "Upcoming items" : "No events scheduled"} className="h-full">
      <div className="space-y-4">
        {todayItems.length > 0 ? todayItems.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-start group">
            <span className="w-12 text-[10px] font-mono text-gray-400 pt-1">
              {item.time.getHours() > 12 ? item.time.getHours() - 12 : (item.time.getHours() === 0 ? 12 : item.time.getHours())}:00 {item.time.getHours() >= 12 ? 'PM' : 'AM'}
            </span>
            <div className="relative flex-1 pb-4">
              <div className="absolute left-[-17px] top-[6px] w-2 h-2 rounded-full border-2 border-white bg-gray-200 group-hover:bg-brand-accent group-hover:scale-125 transition-all" />
              <div className="h-[1px] w-full bg-gray-100 group-hover:bg-gray-200" />
              <div className="mt-2 text-xs text-gray-400 group-hover:text-gray-700 transition-colors">
                {item.label}
              </div>
            </div>
          </div>
        )) : (
          <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400 italic">Schedule is clear! 🎯</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ScheduleWidget;
