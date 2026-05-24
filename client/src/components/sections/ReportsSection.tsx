import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import Card from '../ui/Card';
import { User, Task } from '../../types';

interface ReportsSectionProps {
  team: User[];
  tasks: Task[];
}

const ReportsSection = ({ team, tasks }: ReportsSectionProps) => {
  const data = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    return Array.from({length: 5}).map((_, i) => {
       const d = new Date(today);
       d.setDate(d.getDate() - (4 - i));
       const dayStr = d.toISOString().split('T')[0];
       const doneCount = tasks.filter(t => t.done && t.dueDate && t.dueDate.startsWith(dayStr)).length;
       return { name: i === 4 ? 'Today' : days[d.getDay()], tasks: doneCount, capacity: 100 };
    });
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            📊 Performance Reports
          </h2>
          <p className="text-sm text-gray-500 mt-1">Visual insights into team productivity and focus.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Weekly Productivity" subtitle="Completed tasks per day">
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="tasks" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Team Capacity" subtitle="Current workload vs total bandwidth">
          <div className="space-y-6 mt-4">
            {team.map(m => (
              <div key={m.id} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-700">{m.name}</span>
                  <span className="text-gray-500">{m.capacity}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className={cn("h-full", m.capacity && m.capacity > 85 ? 'bg-red-500' : 'bg-emerald-500')}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.capacity}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsSection;
