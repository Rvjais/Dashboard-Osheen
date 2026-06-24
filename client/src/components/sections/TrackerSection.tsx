import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X, Link as LinkIcon, Paperclip, Trash2, History, Download, Clock, GripVertical } from 'lucide-react';
import { format, parseISO, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import PromptDialog from '../ui/PromptDialog';
import Modal from '../ui/Modal';
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

  // Column order and drag states
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'checkbox',
    'name',
    'type',
    'priority',
    'status',
    'deliverable',
    'assignee',
    'links',
    'actions'
  ]);
  const [draggedCol, setDraggedCol] = useState<string | null>(null);

  // Export states
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportRange, setExportRange] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');

  const { data: historyData } = useQuery({
    queryKey: ['tracker-history'],
    queryFn: () => trackerAPI.getHistory().then(res => res.data),
  });

  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedCol(colId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', colId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetColId) return;

    const draggedIndex = columnOrder.indexOf(draggedCol);
    const targetIndex = columnOrder.indexOf(targetColId);

    const newOrder = [...columnOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedCol);

    setColumnOrder(newOrder);
    setDraggedCol(null);
  };

  const handleExportCSV = () => {
    const combinedTasks = [...tracker, ...historyItems];
    const filteredTasks = combinedTasks.filter(item => {
      if (!item.date) return false;
      const taskDate = parseISO(item.date);
      const today = new Date();
      
      switch (exportRange) {
        case 'daily':
          return isSameDay(taskDate, today);
        case 'weekly':
          return isSameWeek(taskDate, today);
        case 'monthly':
          return isSameMonth(taskDate, today);
        case 'all':
        default:
          return true;
      }
    });

    if (filteredTasks.length === 0) {
      alert('No tasks found in the selected range to export.');
      return;
    }

    const headers = ['Task Name', 'Type', 'Priority', 'Status', 'Deliverable', 'Assignee', 'Link', 'Notes', 'Date', 'Completed At'];
    
    const rows = filteredTasks.map(item => {
      const assigneeName = team.find(m => m.id === item.assigneeId)?.name || 'Unassigned';
      return [
        item.name || '',
        item.type || '',
        item.priority || '',
        item.status || '',
        item.deliverable || '',
        assigneeName,
        item.link || '',
        item.notes || '',
        item.date || '',
        item.completedAt || ''
      ].map(val => {
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `task_studio_export_${exportRange}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportModalOpen(false);
  };

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
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => setExportModalOpen(true)}>
                <Download size={16} /> Export
              </Button>
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
                    <th className="px-4 py-3">Task Name</th>
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
                  {columnOrder.map(colId => {
                    switch (colId) {
                      case 'checkbox':
                        return (
                          <th key="checkbox" className="px-4 py-3 w-10">
                            <input type="checkbox" className="rounded cursor-pointer" checked={allSelected} onChange={toggleSelectAll} />
                          </th>
                        );
                      case 'name':
                        return (
                          <th 
                            key="name" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, 'name')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'name')}
                            className={cn(
                              "px-4 py-3 min-w-[200px] cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors select-none",
                              draggedCol === 'name' && "opacity-50 border-2 border-dashed border-brand-accent"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical size={12} className="text-gray-400 shrink-0" />
                              <span>Task Name</span>
                            </div>
                          </th>
                        );
                      case 'type':
                        return (
                          <th 
                            key="type" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, 'type')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'type')}
                            className={cn(
                              "px-4 py-3 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors select-none",
                              draggedCol === 'type' && "opacity-50 border-2 border-dashed border-brand-accent"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical size={12} className="text-gray-400 shrink-0" />
                              <span>Type</span>
                            </div>
                          </th>
                        );
                      case 'priority':
                        return (
                          <th 
                            key="priority" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, 'priority')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'priority')}
                            className={cn(
                              "px-4 py-3 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors select-none",
                              draggedCol === 'priority' && "opacity-50 border-2 border-dashed border-brand-accent"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical size={12} className="text-gray-400 shrink-0" />
                              <span>Priority</span>
                            </div>
                          </th>
                        );
                      case 'status':
                        return (
                          <th 
                            key="status" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, 'status')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'status')}
                            className={cn(
                              "px-4 py-3 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors select-none",
                              draggedCol === 'status' && "opacity-50 border-2 border-dashed border-brand-accent"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical size={12} className="text-gray-400 shrink-0" />
                              <span>Status</span>
                            </div>
                          </th>
                        );
                      case 'deliverable':
                        return (
                          <th 
                            key="deliverable" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, 'deliverable')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'deliverable')}
                            className={cn(
                              "px-4 py-3 min-w-[150px] cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors select-none",
                              draggedCol === 'deliverable' && "opacity-50 border-2 border-dashed border-brand-accent"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical size={12} className="text-gray-400 shrink-0" />
                              <span>Deliverable</span>
                            </div>
                          </th>
                        );
                      case 'assignee':
                        return (
                          <th 
                            key="assignee" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, 'assignee')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'assignee')}
                            className={cn(
                              "px-4 py-3 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors select-none",
                              draggedCol === 'assignee' && "opacity-50 border-2 border-dashed border-brand-accent"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical size={12} className="text-gray-400 shrink-0" />
                              <span>Assignee</span>
                            </div>
                          </th>
                        );
                      case 'links':
                        return (
                          <th 
                            key="links" 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, 'links')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'links')}
                            className={cn(
                              "px-4 py-3 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors select-none",
                              draggedCol === 'links' && "opacity-50 border-2 border-dashed border-brand-accent"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical size={12} className="text-gray-400 shrink-0" />
                              <span>Links</span>
                            </div>
                          </th>
                        );
                      case 'actions':
                        return (
                          <th key="actions" className="px-4 py-3 w-14"></th>
                        );
                      default:
                        return null;
                    }
                  })}
                </tr>
              </thead>
              <tbody>
                {tracker.map(item => (
                  <tr key={item.id} className="border-b last:border-none border-gray-100 hover:bg-gray-50/50 transition-colors">
                    {columnOrder.map(colId => {
                      switch (colId) {
                        case 'checkbox':
                          return (
                            <td key="checkbox" className="px-4 py-3">
                              <input type="checkbox" className="rounded cursor-pointer" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} />
                            </td>
                          );
                        case 'name':
                          return (
                            <td key="name" className="px-4 py-3">
                              <input
                                className="bg-transparent focus:outline-none focus:bg-white focus:ring-1 ring-gray-200 px-1 rounded font-medium w-full"
                                defaultValue={item.name}
                                onBlur={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, name: e.target.value } : t))}
                              />
                            </td>
                          );
                        case 'type':
                          return (
                            <td key="type" className="px-4 py-3">
                              <select
                                className="bg-gray-100 px-2 py-1 rounded focus:outline-none w-full"
                                value={item.type}
                                onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, type: e.target.value } : t))}
                              >
                                {['Task', 'Deliverable', 'Meeting', 'Creative', 'Note', 'Journal', 'Content'].map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </td>
                          );
                        case 'priority':
                          return (
                            <td key="priority" className="px-4 py-3">
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
                          );
                        case 'status':
                          return (
                            <td key="status" className="px-4 py-3">
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
                          );
                        case 'deliverable':
                          return (
                            <td key="deliverable" className="px-4 py-3">
                              <input
                                className="bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 ring-gray-200 px-2 py-1 rounded w-full transition-colors placeholder:text-gray-300"
                                placeholder="Type here..."
                                defaultValue={item.deliverable === '-' ? '' : item.deliverable}
                                onBlur={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, deliverable: e.target.value || '-' } : t))}
                              />
                            </td>
                          );
                        case 'assignee':
                          return (
                            <td key="assignee" className="px-4 py-3">
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
                          );
                        case 'links':
                          return (
                            <td key="links" className="px-4 py-3">
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
                          );
                        case 'actions':
                          return (
                            <td key="actions" className="px-4 py-3">
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
                          );
                        default:
                          return null;
                      }
                    })}
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

      {/* Export Options Modal */}
      <Modal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Tracker Tasks"
        className="max-w-md"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Export your task history and daily tracker items into a standard CSV file. Select the date range to download.
          </p>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'daily', label: 'Daily (Today)', desc: 'Tasks scheduled for today' },
                { id: 'weekly', label: 'Weekly', desc: 'Tasks from the current week' },
                { id: 'monthly', label: 'Monthly', desc: 'Tasks from the current month' },
                { id: 'all', label: 'All Time', desc: 'Export all available tasks' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExportRange(opt.id as any)}
                  className={cn(
                    "p-4 rounded-2xl border text-left flex flex-col justify-between hover:border-brand-accent transition-all",
                    exportRange === opt.id 
                      ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent' 
                      : 'border-gray-200 bg-white'
                  )}
                >
                  <span className="text-xs font-extrabold text-gray-900">{opt.label}</span>
                  <span className="text-[10px] text-gray-400 mt-1 font-medium leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              variant="secondary"
              className="flex-1 rounded-2xl py-3"
              onClick={() => setExportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-2xl py-3 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-lg shadow-brand-accent/10"
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TrackerSection;
