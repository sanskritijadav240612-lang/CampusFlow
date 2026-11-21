import React from 'react';
import { cn } from '../../utils/cn';

/**
 * StatCard for overview dashboards with clean metrics, subtle borders, and optional trend/icon.
 */
export const StatCard = ({
  label,
  value,
  helper,
  icon: Icon,
  variant = 'default',
  className,
}) => {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-sky-50 text-sky-700',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-surface-border p-5 shadow-soft hover:shadow-elevated transition-shadow duration-150',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {value}
          </p>
          {helper && (
            <p className="text-xs text-slate-500 mt-1">{helper}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'p-2.5 rounded-md shrink-0',
              iconVariants[variant] || iconVariants.default
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
