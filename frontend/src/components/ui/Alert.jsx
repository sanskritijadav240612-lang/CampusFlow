import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Reusable Alert banner for form feedback, warnings, and error messages.
 */
export const Alert = ({
  variant = 'error',
  title,
  children,
  onClose,
  className,
}) => {
  const variants = {
    error: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      container: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: Info,
      iconColor: 'text-sky-600',
    },
  };

  const current = variants[variant] || variants.error;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={cn(
        'p-3.5 rounded-md border flex items-start gap-3 text-xs leading-relaxed shadow-soft transition-all',
        current.container,
        className
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', current.iconColor)} />
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
