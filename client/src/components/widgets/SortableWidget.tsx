import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  span: string;
  isEditing: boolean;
}

const SortableWidget = ({ id, children, span, isEditing }: SortableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
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

export default SortableWidget;
