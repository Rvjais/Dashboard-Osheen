import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, isAfter } from 'date-fns';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { ContentItem, Task, MeetingNote } from '../../types';

interface CalendarSectionProps {
  contentCalendar: ContentItem[];
  setContentCalendar: (items: ContentItem[]) => void;
  tasks: Task[];
  meetingNotes: MeetingNote[];
}

const CalendarSection = ({ contentCalendar, setContentCalendar, tasks, meetingNotes }: CalendarSectionProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const upcomingItem = useMemo(() => {
    return [...contentCalendar]
      .filter(item => isAfter(parseISO(item.publishDate), new Date()) || isSameDay(parseISO(item.publishDate), new Date()))
      .sort((a, b) => parseISO(a.publishDate).getTime() - parseISO(b.publishDate).getTime())[0];
  }, [contentCalendar]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            📆 Content Calendar
          </h2>
          <p className="text-sm text-gray-500 mt-1">Plan and schedule multi-platform content assets.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
           <button className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", viewMode === 'calendar' ? 'bg-white shadow-sm' : 'text-gray-500')} onClick={() => setViewMode('calendar')}>Calendar</button>
           <button className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500')} onClick={() => setViewMode('list')}>List</button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card title="All Content" subtitle={`${contentCalendar.length} items`}>
          <div className="space-y-2">
            {contentCalendar.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No content items yet. Click a day to add one.</p>
            ) : (
              [...contentCalendar]
                .sort((a, b) => parseISO(a.publishDate).getTime() - parseISO(b.publishDate).getTime())
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-gray-400 shrink-0">{format(parseISO(item.publishDate), 'MMM dd')}</span>
                      <span className="text-xs font-bold text-gray-900 truncate">{item.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">{item.platform}</span>
                    </div>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold shrink-0",
                      item.stage === 'Published' ? 'bg-emerald-100 text-emerald-600' :
                      item.stage === 'Draft' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-600'
                    )}>{item.stage}</span>
                  </div>
                ))
            )}
          </div>
        </Card>
      ) : (
      <Card className="p-0 overflow-hidden relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-display font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>Prev</Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Next</Button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="p-4 text-center text-[10px] uppercase font-bold text-gray-400 tracking-widest">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayContent = contentCalendar.filter(c => isSameDay(parseISO(c.publishDate), day));
            const hasContent = dayContent.length > 0;
            
            return (
              <div key={day.toString()} className={cn(
                "min-h-[120px] p-3 border-r border-b border-gray-50 transition-all hover:bg-gray-50 cursor-pointer group relative", 
                !isSameMonth(day, currentMonth) && "opacity-30",
                hasContent && "bg-brand-accent/[0.02]"
              )} onClick={() => {
                const title = prompt(`Add content for ${format(day, 'MMM dd, yyyy')}:`);
                if (title) {
                  setContentCalendar([...contentCalendar, { id: Date.now().toString(), title, publishDate: day.toISOString(), platform: 'Twitter', type: 'Post', creatorId: '1', stage: 'Draft', link: '', goal: '', caption: '', notes: '' }]);
                }
              }}>
                 <div className="flex justify-between items-start">
                    <span className={cn(
                      "text-xs font-mono font-medium", 
                      isToday(day) ? "w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center -ml-1 -mt-1" : "text-gray-500"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {hasContent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(var(--brand-accent-rgb),0.4)]" />
                    )}
                 </div>
                 <div className="mt-2 space-y-1">
                    {dayContent.map(item => (
                      <div key={item.id} className="text-[9px] px-1.5 py-1 rounded-md bg-blue-50/80 text-blue-600 font-bold truncate border border-blue-100/50 group-hover:bg-blue-100/50 transition-colors">
                        {item.platform}: {item.title}
                      </div>
                    ))}
                 </div>
              </div>
            );
          })}
        </div>
      </Card>
      )}
    </div>
  );
};

export default CalendarSection;
