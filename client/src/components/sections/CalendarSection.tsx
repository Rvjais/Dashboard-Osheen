import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, isAfter } from 'date-fns';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { ContentItem, Task, MeetingNote, TrackerItem, TaskPriority, TaskStatus } from '../../types';
import { X, Trash2 } from 'lucide-react';

interface CalendarSectionProps {
  contentCalendar: ContentItem[];
  setContentCalendar: (items: ContentItem[]) => void;
  tracker?: TrackerItem[];
  setTracker?: (items: TrackerItem[]) => void;
  tasks?: Task[]; // Keeping for backwards compatibility if needed
  meetingNotes: MeetingNote[];
  setMeetingNotes?: (items: MeetingNote[]) => void;
  session: { user: { id: string } };
}

const CalendarSection = ({ contentCalendar, setContentCalendar, tracker = [], setTracker, meetingNotes, setMeetingNotes, session }: CalendarSectionProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'task' | 'meeting' | 'content'>('task');
  const [eventTitle, setEventTitle] = useState('');

  const [viewEvent, setViewEvent] = useState<{type: 'task' | 'meeting' | 'content', id: string, title: string, date: string} | null>(null);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const handleAddEvent = () => {
    if (!selectedDate || !eventTitle.trim()) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    if (addType === 'task' && setTracker) {
      setTracker([...tracker, {
        id: crypto.randomUUID(), name: eventTitle, date: dateStr, type: 'Task',
        priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, deliverable: '-',
        assigneeId: session.user.id, link: '', notes: ''
      }]);
    } else if (addType === 'meeting' && setMeetingNotes) {
      setMeetingNotes([...meetingNotes, {
        id: crypto.randomUUID(), title: eventTitle, date: dateStr, type: 'Meeting',
        attendees: [], notes: '', actionItems: '', link: ''
      }]);
    } else if (addType === 'content') {
      setContentCalendar([...contentCalendar, {
        id: crypto.randomUUID(), title: eventTitle, publishDate: dateStr, platform: 'General', type: 'Post',
        creatorId: session.user.id, stage: 'Draft', link: '', goal: '', caption: '', notes: ''
      }]);
    }
    
    setAddModalOpen(false);
    setEventTitle('');
  };

  const handleDeleteEvent = () => {
    if (!viewEvent) return;
    if (viewEvent.type === 'task' && setTracker) setTracker(tracker.filter(t => t.id !== viewEvent.id));
    else if (viewEvent.type === 'meeting' && setMeetingNotes) setMeetingNotes(meetingNotes.filter(m => m.id !== viewEvent.id));
    else if (viewEvent.type === 'content') setContentCalendar(contentCalendar.filter(c => c.id !== viewEvent.id));
    setViewEvent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            📆 Calendar
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage your schedule, tasks, and content assets.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
           <button className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", viewMode === 'calendar' ? 'bg-white shadow-sm' : 'text-gray-500')} onClick={() => setViewMode('calendar')}>Calendar</button>
           <button className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500')} onClick={() => setViewMode('list')}>List</button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card title="All Items" subtitle="Upcoming and past events">
          <div className="space-y-2">
            {contentCalendar.length > 0 ? (
              contentCalendar.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", item.stage === 'published' ? 'bg-emerald-400' : item.stage === 'in_progress' ? 'bg-blue-400' : 'bg-amber-400')} />
                    <div>
                      <span className="text-sm font-bold text-gray-900">{item.title}</span>
                      <span className="text-xs text-gray-400 ml-3">{format(parseISO(item.publishDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-gray-100 text-gray-500">{item.platform}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-gray-100 text-gray-500">{item.stage}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 py-8 text-center">No content items yet.</p>
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
            const dayTasks = tracker.filter(t => t.date && isSameDay(parseISO(t.date), day));
            const dayMeetings = meetingNotes.filter(m => m.date && isSameDay(parseISO(m.date), day));
            
            const hasItems = dayContent.length > 0 || dayTasks.length > 0 || dayMeetings.length > 0;
            
            return (
              <div key={day.toString()} className={cn(
                "min-h-[120px] p-2 border-r border-b border-gray-50 transition-all hover:bg-gray-50 group relative flex flex-col gap-1", 
                !isSameMonth(day, currentMonth) && "opacity-40",
                hasItems && "bg-brand-accent/[0.01]"
              )} 
              onClick={() => {
                setSelectedDate(day);
                setAddModalOpen(true);
              }}>
                 <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "text-xs font-mono font-medium", 
                      isToday(day) ? "w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center -ml-1 -mt-1" : "text-gray-500"
                    )}>
                      {format(day, 'd')}
                    </span>
                 </div>
                 
                 {/* Meetings */}
                 {dayMeetings.map(m => (
                    <div 
                      key={m.id} 
                      onClick={(e) => { e.stopPropagation(); setViewEvent({ type: 'meeting', id: m.id, title: m.title, date: m.date }); }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium truncate cursor-pointer hover:bg-blue-200 transition-colors"
                    >
                      🗓️ {m.title}
                    </div>
                 ))}
                 
                 {/* Tasks */}
                 {dayTasks.map(t => (
                    <div 
                      key={t.id} 
                      onClick={(e) => { e.stopPropagation(); setViewEvent({ type: 'task', id: t.id, title: t.name, date: t.date }); }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium truncate cursor-pointer hover:bg-amber-200 transition-colors"
                    >
                      📋 {t.name}
                    </div>
                 ))}

                 {/* Content */}
                 {dayContent.map(c => (
                    <div 
                      key={c.id} 
                      onClick={(e) => { e.stopPropagation(); setViewEvent({ type: 'content', id: c.id, title: c.title, date: c.publishDate }); }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium truncate cursor-pointer hover:bg-emerald-200 transition-colors"
                    >
                      📱 {c.title}
                    </div>
                 ))}
              </div>
            );
          })}
        </div>
      </Card>
      )}

      {/* Add Event Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <div className="p-6 w-full max-w-md bg-white rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-display text-gray-900">Add to Calendar</h3>
            <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 mb-2">DATE</p>
            <p className="text-sm font-medium">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</p>
          </div>

          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 mb-2">EVENT TYPE</p>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setAddType('task')} className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-colors", addType === 'task' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:bg-gray-200')}>Task</button>
              <button onClick={() => setAddType('meeting')} className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-colors", addType === 'meeting' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200')}>Meeting</button>
              <button onClick={() => setAddType('content')} className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-colors", addType === 'content' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:bg-gray-200')}>Content</button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 mb-2">TITLE</p>
            <input 
              type="text"
              autoFocus
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-1 ring-brand-accent"
              placeholder="E.g., Team Sync, Weekly Report..."
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEvent}>Add Event</Button>
          </div>
        </div>
      </Modal>

      {/* View Event Modal */}
      <Modal open={!!viewEvent} onClose={() => setViewEvent(null)}>
        {viewEvent && (
          <div className="p-6 w-full max-w-sm bg-white rounded-2xl relative">
            <button onClick={() => setViewEvent(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <div className="mb-2">
               <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded", 
                  viewEvent.type === 'task' ? 'bg-amber-100 text-amber-600' : 
                  viewEvent.type === 'meeting' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
               )}>
                 {viewEvent.type}
               </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{viewEvent.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{viewEvent.date ? format(parseISO(viewEvent.date), 'MMMM d, yyyy') : 'No date'}</p>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="danger" className="w-full gap-2 justify-center" onClick={handleDeleteEvent}>
                <Trash2 size={16} /> Delete {viewEvent.type}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarSection;
