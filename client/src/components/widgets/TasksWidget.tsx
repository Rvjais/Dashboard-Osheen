import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import Card from '../ui/Card';
import { TrackerItem, TaskPriority, TaskStatus } from '../../types';

interface TasksWidgetProps {
  tracker: TrackerItem[];
  setTracker: (tracker: TrackerItem[]) => void;
}

const TasksWidget = ({ tracker, setTracker }: TasksWidgetProps) => {
  const pendingTasks = tracker.filter(t => t.status !== TaskStatus.DONE);

  return (
    <Card title="Priority Tasks" className="h-full">
      <div className="space-y-3">
        {pendingTasks.slice(0, 4).map(task => (
          <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
            <button 
              onClick={() => setTracker(tracker.map(t => t.id === task.id ? { ...t, status: TaskStatus.DONE } : t))}
              className="w-5 h-5 rounded-md border border-gray-300 flex items-center justify-center hover:border-brand-accent"
            >
              <CheckCircle2 size={14} className="text-white" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
              <div className="flex gap-2 mt-1">
                <span className={cn("text-[8px] px-1.5 py-0.5 rounded uppercase font-bold", 
                  task.priority === TaskPriority.DAILY ? 'bg-blue-100 text-blue-600' :
                  task.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                )}>
                  {task.priority}
                </span>
              </div>
            </div>
          </div>
        ))}
        {pendingTasks.length === 0 && (
          <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400 italic">No pending tasks. Relax! 🧘</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TasksWidget;
