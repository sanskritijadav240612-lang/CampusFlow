import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/cn';

/**
 * ErrorState component for displaying friendly API or runtime errors with retry capability.
 */
export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'text-center py-10 px-6 rounded-lg border border-rose-200 bg-rose-50/40 flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-rose-900">{title}</h3>
      <p className="text-xs text-rose-700/80 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            leftIcon={RefreshCw}
            className="border-rose-300 text-rose-800 hover:bg-rose-100/50"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
