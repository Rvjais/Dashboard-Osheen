import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-accent text-white hover:bg-red-600 shadow-sm',
      secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
      ghost: 'bg-transparent text-gray-500 hover:bg-gray-100',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    return (
      <button
        ref={ref}
        className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50', variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

export default Button;
