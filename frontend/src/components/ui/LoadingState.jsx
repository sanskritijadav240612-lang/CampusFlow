import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * LoadingState indicator for views or sections fetching data.
 */
export const LoadingState = ({
  message = 'Loading...',
  fullScreen = false,
  className,
}) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-campus-50 text-campus-700 flex items-center justify-center mb-3 shadow-soft">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          CampusFlow
        </p>
        <p className="text-sm text-slate-700 mt-1">{message}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'py-12 px-6 flex flex-col items-center justify-center text-center',
        className
      )}
    >
      <Loader2 className="w-6 h-6 text-campus-700 animate-spin mb-2" />
      <p className="text-xs text-slate-500 font-medium">{message}</p>
    </div>
  );
};

export default LoadingState;
