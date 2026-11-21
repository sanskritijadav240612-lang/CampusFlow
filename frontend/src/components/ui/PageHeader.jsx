import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Standard PageHeader component providing title, description, status badge, and action slots.
 */
export const PageHeader = ({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
}) => {
  return (
    <div className={cn('pb-6 border-b border-surface-border mb-6', className)}>
      {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
