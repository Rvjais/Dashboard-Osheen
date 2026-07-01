import { useState } from 'react';
import { motion } from 'framer-motion';
import { Grid, GripVertical } from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import WelcomeWidget from '../widgets/WelcomeWidget';
import ClockWidget from '../widgets/ClockWidget';
import StatsWidget from '../widgets/StatsWidget';
import ScheduleWidget from '../widgets/ScheduleWidget';
import TasksWidget from '../widgets/TasksWidget';
import IdeasWidget from '../widgets/IdeasWidget';
import { Section, User, Task, MeetingNote, Idea, TrackerItem } from '../../types';

interface HomeSectionProps {
  session: { user: User } | null;
  tasks: Task[];
  tracker: TrackerItem[];
  meetingNotes: MeetingNote[];
  ideas: Idea[];
  team: User[];
  dayScore: number;
  dailyBrief: string;
  currentTime: Date;
  updateMood: (m: string) => void;
  setCurrentSection: (s: Section) => void;
  homeWidgets: { id: string; span: string; visible?: boolean }[];
  setHomeWidgets: (widgets: { id: string; span: string; visible?: boolean }[]) => void;
  setIdeas: (ideas: Idea[]) => void;
  setTasks: (tasks: Task[]) => void;
  setTracker: (tracker: TrackerItem[]) => void;
}

const HomeSection = ({
  session, tasks, tracker, meetingNotes, ideas, team, dayScore, dailyBrief, currentTime, updateMood, setCurrentSection,
  homeWidgets, setHomeWidgets, setIdeas, setTasks, setTracker
}: HomeSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = homeWidgets.findIndex(item => item.id === active.id);
      const newIndex = homeWidgets.findIndex(item => item.id === over.id);
      setHomeWidgets(arrayMove(homeWidgets, oldIndex, newIndex));
    }
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'welcome': return <WelcomeWidget session={session} dailyBrief={dailyBrief} updateMood={updateMood} dayScore={dayScore} />;
      case 'clock': return <ClockWidget currentTime={currentTime} team={team} />;
      case 'stats': return <StatsWidget tasks={tasks} meetingNotes={meetingNotes} ideas={ideas} tracker={tracker} />;
      case 'schedule': return <ScheduleWidget meetingNotes={meetingNotes} tracker={tracker} tasks={tasks} />;
      case 'tasks': return <TasksWidget tracker={tracker} setTracker={setTracker} />;
      case 'ideas': return <IdeasWidget ideas={ideas} setIdeas={setIdeas} />;
      default: return null;
    }
  };

  const visibleWidgets = homeWidgets.filter((w: any) => w.visible !== false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Workspace Overview</h2>
            {isEditing && (
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                {homeWidgets.map((w: any) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setHomeWidgets(homeWidgets.map((hw: any) => hw.id === w.id ? { ...hw, visible: !hw.visible } : hw));
                    }}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded transition-all",
                      w.visible !== false ? "bg-white text-brand-accent shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {w.id.charAt(0).toUpperCase() + w.id.slice(1)}
                  </button>
                ))}
              </div>
            )}
         </div>
         <Button 
          variant={isEditing ? 'primary' : 'secondary'} 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
         >
           <Grid size={16} />
           {isEditing ? 'Finish Customizing' : 'Customize Layout'}
         </Button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
            {visibleWidgets.map((widget: any) => (
              <SortableWidget key={widget.id} id={widget.id} span={widget.span} isEditing={isEditing}>
                {renderWidget(widget.id)}
              </SortableWidget>
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};

const SortableWidget = ({ id, children, span, isEditing }: { id: string; children: React.ReactNode; span: string; isEditing: boolean }) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative group", span)}>
      {isEditing && (
        <div 
          className="absolute top-2 right-2 z-20 cursor-grab active:cursor-grabbing p-2 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} className="text-gray-400" />
        </div>
      )}
      {children}
    </div>
  );
};

export default HomeSection;
