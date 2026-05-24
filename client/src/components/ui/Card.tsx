import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}

const Card = ({ children, className, title, subtitle, action, ...props }: CardProps) => (
  <div className={cn('glass-card p-6 flex flex-col gap-4', className)} {...props}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-2">
        <div>
          {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

export default Card;
