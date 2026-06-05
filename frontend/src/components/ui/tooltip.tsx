import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom';
  children: ReactNode;
}

export function Tooltip({ content, position = 'top', children }: TooltipProps) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          'bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap max-w-xs',
          position === 'top' && 'bottom-full mb-1.5',
          position === 'bottom' && 'top-full mt-1.5'
        )}
      >
        {content}
      </span>
    </span>
  );
}
