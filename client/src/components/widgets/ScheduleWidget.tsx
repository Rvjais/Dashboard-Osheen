import Card from '../ui/Card';
import { MeetingNote, TrackerItem, TaskStatus } from '../../types';

interface ScheduleWidgetProps {
  meetingNotes: MeetingNote[];
  tracker: TrackerItem[];
}

const ScheduleWidget = ({ meetingNotes, tracker }: ScheduleWidgetProps) => {
  const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  const todayItems = [
    ...meetingNotes
      .filter((m: MeetingNote) => m.date && m.date.startsWith(todayStr))
      .map((m: MeetingNote) => ({ label: `Meeting: ${m.title}`, type: 'meeting' })),
    ...tracker
      .filter((t: TrackerItem) => t.date === todayStr && t.status !== TaskStatus.DONE)
      .map((t: TrackerItem) => ({ label: `Task: ${t.name}`, type: 'task' }))
  ];

  return (
    <Card title="Today's Schedule" subtitle={todayItems.length > 0 ? "Upcoming items" : "No events scheduled"} className="h-full">
      <div className="space-y-4">
        {todayItems.length > 0 ? todayItems.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-start group">
            <span className="w-6 text-[12px] pt-0.5 flex justify-center">
              {item.type === 'meeting' ? '🗓️' : '📋'}
            </span>
            <div className="relative flex-1 pb-4">
              <div className="h-[1px] w-full bg-gray-100 group-hover:bg-gray-200 mt-2" />
              <div className="mt-2 text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
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
