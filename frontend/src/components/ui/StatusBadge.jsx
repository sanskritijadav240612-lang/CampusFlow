import React from 'react';
import { cn } from '../../utils/cn';

/**
 * StatusBadge represents lifecycle states with precise campus operations color semantics.
 * Supported statuses:
 * - 'Under Review', 'pending', 'processing' -> Amber
 * - 'Approved', 'active', 'sent' -> Emerald
 * - 'Rejected', 'failed', 'inactive' -> Rose / Slate
 */
export const StatusBadge = ({ status, className }) => {
  const normalized = (status || '').toString().toLowerCase().trim();

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotStyle = 'bg-slate-400';
  let label = status || 'Unknown';

  if (normalized === 'under review' || normalized === 'pending') {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80';
    dotStyle = 'bg-amber-500 animate-pulse';
    label = status === 'pending' ? 'Pending' : 'Under Review';
  } else if (normalized === 'processing') {
    badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200/80';
    dotStyle = 'bg-blue-500 animate-pulse';
    label = 'Processing';
  } else if (normalized === 'approved' || normalized === 'active' || normalized === 'sent') {
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    dotStyle = 'bg-emerald-500';
    label = normalized === 'active' ? 'Active' : normalized === 'sent' ? 'Sent' : 'Approved';
  } else if (normalized === 'rejected' || normalized === 'failed') {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200/80';
    dotStyle = 'bg-rose-500';
    label = normalized === 'failed' ? 'Failed' : 'Rejected';
  } else if (normalized === 'inactive') {
    badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
    dotStyle = 'bg-slate-400';
    label = 'Inactive';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        badgeStyle,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotStyle)} />
      {label}
    </span>
  );
};

export default StatusBadge;
