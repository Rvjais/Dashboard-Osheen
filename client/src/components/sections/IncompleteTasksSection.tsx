import { useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../../lib/utils';
import Card from '../ui/Card';
import { TrackerItem, TaskPriority, TaskStatus, User } from '../../types';

interface IncompleteTasksSectionProps {
  tracker: TrackerItem[];
  setTracker: (items: TrackerItem[]) => void;
  team: User[];
  session: { user: User };
}

const IncompleteTasksSection = ({ tracker, setTracker, team, session }: IncompleteTasksSectionProps) => {
  const incomplete = useMemo(() =>
    tracker
      .filter(t => t.status !== TaskStatus.DONE)
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      }),
    [tracker]
  );

  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return incomplete.filter(t => t.date && t.date < today).length;
  }, [incomplete]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            ⏳ Incomplete Tasks
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {incomplete.length} pending task{incomplete.length !== 1 ? 's' : ''}
            {overdueCount > 0 && ` — ${overdueCount} overdue`}
          </p>
        </div>
      </div>

      {incomplete.length === 0 ? (
        <Card title="All Clear" subtitle="No incomplete tasks found">
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">🎉 All tasks are completed. Great work!</p>
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-sm min-w-[200px]">Task Name</th>
                  <th className="px-4 py-3 text-sm">Status</th>
                  <th className="px-4 py-3 text-sm">Priority</th>
                  <th className="px-4 py-3 text-sm">Due Date</th>
                  <th className="px-4 py-3 text-sm">Days Overdue</th>
                  <th className="px-4 py-3 text-sm">Progress</th>
                  <th className="px-4 py-3 text-sm">Assignee</th>
                  <th className="px-4 py-3 text-sm w-14">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomplete.map(item => {
                  const daysSince = item.date ? differenceInDays(new Date(), parseISO(item.date)) : 0;
                  const isOverdue = item.date && item.date < new Date().toISOString().split('T')[0];
                  return (
                    <tr key={item.id} className="border-b last:border-none border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <input
                          className="bg-transparent focus:outline-none focus:bg-white focus:ring-1 ring-gray-200 px-1 rounded font-medium w-full"
                          value={item.name}
                          onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, name: e.target.value } : t))}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          className={cn("px-3 py-1.5 rounded-full text-xs font-bold focus:outline-none shadow-sm cursor-pointer",
                            item.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            item.status === TaskStatus.BLOCKED ? 'bg-red-50 text-red-700 border border-red-200' :
                            item.status === TaskStatus.IN_REVIEW ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-gray-50 text-gray-700 border border-gray-200'
                          )}
                          value={item.status}
                          onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? {
                            ...t,
                            status: e.target.value as TaskStatus,
                            completedAt: e.target.value === TaskStatus.DONE ? new Date().toISOString() : t.completedAt
                          } : t))}
                        >
                          {Object.values(TaskStatus).map(v => <option key={v} value={v}>
                            {v === TaskStatus.DONE ? '🟢 ' :
                             v === TaskStatus.IN_PROGRESS ? '🔵 ' :
                             v === TaskStatus.BLOCKED ? '🔴 ' :
                             v === TaskStatus.IN_REVIEW ? '🟡 ' : '⚪ '}
                            {v.replace('_', ' ')}
                          </option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          className={cn("px-3 py-1.5 rounded-full text-xs font-bold focus:outline-none shadow-sm cursor-pointer",
                            item.priority === TaskPriority.DAILY ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            item.priority === TaskPriority.WEEKLY ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            item.priority === TaskPriority.MONTHLY ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                            item.priority === TaskPriority.HIGH ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-gray-50 text-gray-700 border border-gray-200'
                          )}
                          value={item.priority || ''}
                          onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, priority: e.target.value as TaskPriority } : t))}
                        >
                          <option value={TaskPriority.EMERGENCY}>Emergency</option>
                          <option value={TaskPriority.HIGH}>High</option>
                          <option value={TaskPriority.MEDIUM}>Medium</option>
                          <option value={TaskPriority.LOW}>Low</option>
                          <option value={TaskPriority.DAILY}>Daily</option>
                          <option value={TaskPriority.WEEKLY}>Weekly</option>
                          <option value={TaskPriority.MONTHLY}>Monthly</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="date"
                          className="bg-transparent focus:outline-none focus:bg-white focus:ring-1 ring-gray-200 px-2 py-1 rounded text-sm text-gray-600"
                          value={item.date || ''}
                          onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, date: e.target.value } : t))}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isOverdue ? (
                          <span className="text-red-600 font-bold">
                            {daysSince} day{daysSince !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${item.progress || 0}%` }} />
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-10 bg-transparent text-sm text-gray-500 focus:outline-none focus:bg-white focus:ring-1 ring-gray-200 px-1 rounded text-right"
                            value={item.progress || 0}
                            onChange={(e) => setTracker(tracker.map(t => t.id === item.id ? { ...t, progress: parseInt(e.target.value) || 0 } : t))}
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
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
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => setTracker(tracker.filter(t => t.id !== item.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            {incomplete.length} task{incomplete.length !== 1 ? 's' : ''} remaining
            {overdueCount > 0 && ` — ${overdueCount} overdue`}
          </div>
        </div>
      )}
    </div>
  );
};

export default IncompleteTasksSection;
