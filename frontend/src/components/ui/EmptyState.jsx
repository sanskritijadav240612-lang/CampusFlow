import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/cn';

/**
 * EmptyState display for when lists or tables have no items.
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are currently no records to display here.',
  actionText,
  onAction,
  actionIcon,
  className,
}) => {
  return (
    <div
      className={cn(
        'text-center py-12 px-6 rounded-lg border border-dashed border-slate-300 bg-white/50 flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
      {actionText && onAction && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onAction}
            leftIcon={actionIcon}
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
