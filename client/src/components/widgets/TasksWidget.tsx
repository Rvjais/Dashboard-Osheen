import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import Card from '../ui/Card';
import { Task, TaskPriority } from '../../types';

interface TasksWidgetProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const TasksWidget = ({ tasks, setTasks }: TasksWidgetProps) => (
  <Card title="Priority Tasks" className="h-full">
    <div className="space-y-3">
      {tasks.filter(t => !t.done).slice(0, 4).map(task => (
        <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
          <button 
            onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, done: true } : t))}
            className="w-5 h-5 rounded-md border border-gray-300 flex items-center justify-center hover:border-brand-accent"
          >
            <CheckCircle2 size={14} className="text-white" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
            <div className="flex gap-2 mt-1">
              <span className={cn("text-[8px] px-1.5 py-0.5 rounded uppercase font-bold", 
                task.priority === TaskPriority.EMERGENCY ? 'bg-red-100 text-red-600' : 
                task.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
              )}>
                {task.priority}
              </span>
            </div>
          </div>
        </div>
      ))}
      {tasks.filter(t => !t.done).length === 0 && (
        <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-xs text-gray-400 italic">No pending tasks. Relax! 🧘</p>
        </div>
      )}
    </div>
  </Card>
);

export default TasksWidget;
