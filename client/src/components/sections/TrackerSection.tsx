import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X, Link as LinkIcon, Paperclip, Trash2, History, Download, Clock } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import PromptDialog from '../ui/PromptDialog';
import { trackerAPI } from '../../services/api';
import { TrackerItem, TaskPriority, TaskStatus, User } from '../../types';

interface TrackerSectionProps {
  tracker: TrackerItem[];
  setTracker: (items: TrackerItem[]) => void;
  session: { user: User };
  team: User[];
  setFocusMode?: (mode: { active: boolean; taskName: string; duration: number; timeLeft: number; timerActive: boolean } | null) => void;
  setCurrentSection?: (s: any) => void;
}

const TrackerSection = ({ tracker, setTracker, session, team, setFocusMode, setCurrentSection }: TrackerSectionProps) => {
  const [viewMode, setViewMode] = useState<'table' | 'board' | 'timeline'>('table');
  const [linkPrompt, setLinkPrompt] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quickInput, setQuickInput] = useState('');
  const [timelineDate, setTimelineDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: historyData } = useQuery({
    queryKey: ['tracker-history'],
    queryFn: () => trackerAPI.getHistory().then(res => res.data),
    enabled: showHistory,
  });

  const historyItems = useMemo(() => {
    const raw = Array.isArray(historyData) ? historyData : (historyData?.items || []);
    return raw as TrackerItem[];
  }, [historyData]);

  const allSelected = tracker.length > 0 && selectedIds.size === tracker.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tracker.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const autoTimeSlot = () => {
    const h = new Date().getHours();
    if (h < 7) return 7;
    if (h > 18) return undefined;
    return h;
  };

  const deleteSelected = () => {
    setTracker(tracker.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  };

  const quickAddItem = (title: string) => {
    if (!title.trim()) return;
    const newItem: TrackerItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: title,
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'Task',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      deliverable: '-',
      assigneeId: session?.user.id || '',
      link: '',
      notes: '',
      timeSlot: autoTimeSlot()
    };
    setTracker([newItem, ...tracker]);
    setQuickInput('');
  };

  const timelineItems = useMemo(() =>
    tracker
      .filter(t => t.date && isSameDay(parseISO(t.date), timelineDate))
      .map(t => ({
        ...t,
        completedTimeSlot: t.completedAt && isSameDay(parseISO(t.completedAt as string), timelineDate)
          ? new Date(t.completedAt).getHours()
          : undefined
      })),
    [tracker, timelineDate]
  );

  const updateStatus = (id: string, status: TaskStatus) => {
    setTracker(tracker.map(t => t.id === id ? {
      ...t,
      status,
      completedAt: status === TaskStatus.DONE ? new Date().toISOString() : t.completedAt
    } : t));
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 7);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            📋 Daily Tracker
          </h2>
          <p className="text-sm text-gray-500 mt-1">Tasks, deliverables, and your daily timeline.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!showHistory ? (
            <>
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')}>Table</Button>
              <Button variant={viewMode === 'board' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('board')}>Board</Button>
              <Button variant={viewMode === 'timeline' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('timeline')}>Timeline</Button>
              {selectedIds.size > 0 ? (
                <Button size="sm" variant="danger" className="gap-2" onClick={deleteSelected}>
                  <Trash2 size={16} /> Delete ({selectedIds.size})
                </Button>
              ) : (
                <Button size="sm" className="gap-2" onClick={() => {
                  const newItem: TrackerItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'New Task Item',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    type: 'Task',
                    priority: TaskPriority.MEDIUM,
                    status: TaskStatus.TODO,
                    deliverable: '-',
                    assigneeId: session?.user.id || '',
                    link: '',
                    notes: '',
                    timeSlot: autoTimeSlot()
                  };
                  setTracker([newItem, ...tracker]);
                }}>
                  <Plus size={16} /> New Row
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowHistory(true)}>
                <History size={16} /> History
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowHistory(false)}>
              ← Back to Tracker
            </Button>
          )}
        </div>
      </div>

      {!showHistory && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-2">
          <input
            className="flex-1 bg-transparent focus:outline-none text-sm px-2"
            placeholder="Quick add task — type and press Enter..."
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') quickAddItem(quickInput);
            }}
          />
          <Button size="sm" onClick={() => quickAddItem(quickInput)}>Add</Button>
        </div>
      )}

      {showHistory ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-display font-bold text-gray-900">Completed Tasks History</h3>
            <p className="text-xs text-gray-500 mt-1">Archived completed tasks from previous days</p>
          </div>
          {historyItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Completed At</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Deliverable</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-gray-500">{item.date}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono">
                        {item.completedAt ? format(parseISO(item.completedAt as string), 'MMM dd, HH:mm') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          item.priority === TaskPriority.EMERGENCY ? 'bg-red-100 text-red-600' :
                          item.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-600' :
                          item.priority === TaskPriority.MEDIUM ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        )}>{item.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ backgroundColor: team.find(m => m.id === item.assigneeId)?.avatarColor || '#ccc' }}>
                            {team.find(m => m.id === item.assigneeId)?.name.charAt(0) || '?'}
                          </div>
                          <span>{team.find(m => m.id === item.assigneeId)?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.deliverable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <History size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-sm text-gray-400">No completed tasks archived yet.</p>
              <p className="text-xs text-gray-300 mt-1">Completed tasks from previous days will appear here automatically.</p>
            </div>
          )}
          {historyItems.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Total: {historyItems.length} completed task{historyItems.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" className="rounded cursor-pointer" checked={allSelected} onChange={toggleSelectAll} />
                  </th>
                  <th className="px-4 py-3 min-w-[200px]">Item Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 min-w-[150px]">Deliverable</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Links</th>
                  <th className="px-4 py-3 w-14"></th>
                </tr>
              </thead>
              <tbody>
                {tracker.map(item => (
                  <tr key={item.id} className="border-b last:border-none border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded cursor-pointer" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="bg-transparent focus:outline-none focus:bg-white focus:ring-1 ring-gray-200 px-1 rounded font-medium w-full"
                        defaultValue={item.name}
                        onBlur={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, name: e.target.value } : t))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="bg-gray-100 px-2 py-1 rounded focus:outline-none w-full"
                        value={item.type}
                        onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, type: e.target.value } : t))}
                      >
                        {['Task', 'Deliverable', 'Meeting', 'Creative', 'Note', 'Journal', 'Content'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase focus:outline-none appearance-none cursor-pointer",
                          item.priority === TaskPriority.EMERGENCY ? 'bg-red-100 text-red-600' :
                          item.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-600' :
                          item.priority === TaskPriority.MEDIUM ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        )}
                        value={item.priority}
                        onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, priority: e.target.value as TaskPriority } : t))}
                      >
                        {Object.values(TaskPriority).map(v => <option key={v} value={v}>{v === TaskPriority.EMERGENCY ? '🚨 Emergency' : v}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase focus:outline-none",
                          item.status === TaskStatus.DONE ? 'bg-emerald-100 text-emerald-600' :
                          item.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                        )}
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value as TaskStatus)}
                      >
                        {Object.values(TaskStatus).map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 ring-gray-200 px-2 py-1 rounded w-full transition-colors placeholder:text-gray-300"
                        placeholder="Type here..."
                        defaultValue={item.deliverable === '-' ? '' : item.deliverable}
                        onBlur={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, deliverable: e.target.value || '-' } : t))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[8px] font-bold text-white uppercase"
                          style={{ backgroundColor: team.find(m => m.id === item.assigneeId)?.avatarColor || '#ccc' }}
                        >
                          {team.find(m => m.id === item.assigneeId)?.name.charAt(0) || '?'}
                        </div>
                        <select
                          className="bg-transparent text-xs font-medium focus:outline-none w-full cursor-pointer truncate max-w-[80px]"
                          value={item.assigneeId || ''}
                          onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, assigneeId: e.target.value } : t))}
                        >
                          <option value="">Unassigned</option>
                          {team.map((m: User) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        {item.link ? (
                          <div className="flex gap-1 items-center">
                            <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                              <LinkIcon size={14} />
                            </a>
                            <button onClick={() => setTracker(tracker.map(t => t.id === item.id ? { ...t, link: '' } : t))} className="text-gray-300 hover:text-red-500" title="Remove Link"><X size={12} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setLinkPrompt(item.id)} className="text-gray-300 hover:text-brand-accent transition-colors"><Plus size={14} /></button>
                        )}
                        {item.attachment ? (
                          <a href={item.attachment.path} download={item.attachment.name} className="text-emerald-500 hover:text-emerald-700" title={item.attachment.name}>
                            <Download size={14} />
                          </a>
                        ) : (
                          <button onClick={() => fileInputRef.current?.click()} className="text-gray-300 hover:text-gray-500 transition-colors"><Paperclip size={14} /></button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {setFocusMode && (
                          <button onClick={() => setFocusMode({ active: true, taskName: item.name, duration: 25, timeLeft: 25 * 60, timerActive: false })} className="text-gray-300 hover:text-brand-accent transition-colors" title="Focus mode">
                            <Clock size={14} />
                          </button>
                        )}
                        <button onClick={() => setTracker(tracker.filter(t => t.id !== item.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'board' ? (
        <div className="flex gap-6 overflow-x-auto pb-4 items-start min-h-[600px]">
          {Object.values(TaskStatus).map(status => (
            <div key={status} className="flex-none w-[320px] bg-gray-50/50 rounded-xl p-4 flex flex-col gap-3 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500">{status.replace('_', ' ')}</h3>
                <span className="text-xs font-bold bg-white text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                  {tracker.filter(t => t.status === status).length}
                </span>
              </div>

              {tracker.filter(t => t.status === status).map(item => (
                <Card key={item.id} className="p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 bg-white border border-gray-200 shadow-sm group">
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-1 rounded",
                      item.priority === TaskPriority.EMERGENCY ? 'bg-red-100 text-red-600' :
                      item.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-600' :
                      item.priority === TaskPriority.MEDIUM ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    )}>
                      {item.priority === TaskPriority.EMERGENCY ? '🚨 Emergency' : item.priority}
                    </span>
                    <div className="flex gap-1">
                      {setFocusMode && (
                        <button onClick={(e) => { e.stopPropagation(); setFocusMode({ active: true, taskName: item.name, duration: 25, timeLeft: 25 * 60, timerActive: false }); }} className="text-gray-300 hover:text-brand-accent transition-colors" title="Focus mode">
                          <Clock size={14} />
                        </button>
                      )}
                      {item.assigneeId && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm"
                          style={{ backgroundColor: team.find(m => m.id === item.assigneeId)?.avatarColor || '#ccc' }}
                          title={team.find(m => m.id === item.assigneeId)?.name}
                        >
                          {team.find(m => m.id === item.assigneeId)?.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm mb-1 text-gray-800">{item.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">{item.type}</span>
                    <span className="truncate max-w-[120px]" title={item.deliverable}>{item.deliverable}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select
                      className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-gray-400 hover:text-gray-800"
                      value={item.status}
                      onChange={(e) => { e.stopPropagation(); updateStatus(item.id, e.target.value as TaskStatus); }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {Object.values(TaskStatus).map(v => <option key={v} value={v}>Move to {v.replace('_', ' ')}</option>)}
                    </select>
                    <button onClick={(e) => { e.stopPropagation(); setTracker(tracker.filter(t => t.id !== item.id)); }} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              ))}

              <Button
                variant="ghost"
                className="w-full mt-2 text-gray-400 hover:text-brand-accent hover:bg-white dashed border border-transparent hover:border-gray-200"
                onClick={() => {
                  const newItem: TrackerItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'New ' + status.replace('_', ' ') + ' Item',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    type: 'Task',
                    priority: TaskPriority.MEDIUM,
                    status: status as TaskStatus,
                    deliverable: '-',
                    assigneeId: session?.user.id || '',
                    link: '',
                    notes: '',
                    timeSlot: autoTimeSlot()
                  };
                  setTracker([newItem, ...tracker]);
                }}
              >
                <Plus size={16} className="mr-1" /> Add Card
              </Button>
            </div>
          ))}
        </div>
      ) : (
        /* Timeline View */
        <Card title={`Timeline — ${format(timelineDate, 'MMM dd, yyyy')}`} className="h-fit">
          <div className="flex gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setTimelineDate(new Date(timelineDate.getTime() - 86400000))}>← Prev Day</Button>
            <Button variant="ghost" size="sm" onClick={() => setTimelineDate(new Date())}>Today</Button>
            <Button variant="ghost" size="sm" onClick={() => setTimelineDate(new Date(timelineDate.getTime() + 86400000))}>Next Day →</Button>
          </div>
          <div className="space-y-1">
            {hours.map(h => {
              const started = timelineItems.filter(t => t.timeSlot === h);
              const completed = timelineItems.filter(t => t.completedTimeSlot === h && t.timeSlot !== h);
              const hasItems = started.length > 0 || completed.length > 0;
              return (
                <div key={h} className="group relative flex gap-6 items-start py-1">
                  <span className="w-14 text-[10px] font-mono text-gray-400 pt-1 shrink-0">
                    {h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}
                  </span>
                  <div className={cn("flex-1 min-h-[40px] border-l-2 pl-6 transition-all", hasItems ? "border-brand-accent" : "border-gray-100 group-hover:border-brand-accent/50")}>
                    {hasItems ? (
                      <div className="space-y-1">
                        {started.map(t => (
                          <div key={`s-${t.id}`} className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 shadow-sm font-medium group/card">
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <span className="truncate">{t.name}</span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-200 text-blue-700 uppercase font-bold shrink-0">Started</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
                              {setFocusMode && (
                                <button onClick={() => setFocusMode({ active: true, taskName: t.name, duration: 25, timeLeft: 25 * 60, timerActive: false })} className="text-blue-400 hover:text-blue-600" title="Focus mode">
                                  <Clock size={12} />
                                </button>
                              )}
                              <button onClick={() => setTracker(tracker.filter(x => x.id !== t.id))} className="text-gray-400 hover:text-red-500" title="Delete">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {completed.map(t => (
                          <div key={`c-${t.id}`} className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 shadow-sm font-medium group/card">
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <span className="truncate">{t.name}</span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-700 uppercase font-bold shrink-0">✓ Done</span>
                            </div>
                            <button onClick={() => setTracker(tracker.filter(x => x.id !== t.id))} className="text-gray-400 hover:text-red-500 shrink-0" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 min-h-[36px] flex items-center">
                        <span className="text-xs text-gray-300 italic">— Empty —</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <PromptDialog
        open={!!linkPrompt}
        onClose={() => setLinkPrompt(null)}
        onSubmit={(url) => {
          setTracker(tracker.map(t => t.id === linkPrompt ? { ...t, link: url } : t));
          setLinkPrompt(null);
        }}
        title="Add Link URL"
        placeholder="https://docs.google.com/..."
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            try {
              const res = await trackerAPI.upload(file);
              if (tracker.length > 0) {
                setTracker(tracker.map((t, idx) => idx === 0 ? { ...t, attachment: res.data.attachment } : t));
              }
            } catch (err) {
              console.error('Upload failed:', err);
            }
          }
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default TrackerSection;
