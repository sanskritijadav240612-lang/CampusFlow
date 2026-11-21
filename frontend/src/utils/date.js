/**
 * Date and time formatting helpers for CampusFlow frontend.
 */

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: options.dateStyle || 'medium',
    ...options,
  }).format(d);
};

export const formatTime = (dateString, options = {}) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeStyle: options.timeStyle || 'short',
    ...options,
  }).format(d);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';

  return `${formatDate(d)} at ${formatTime(d)}`;
};

export const formatTimeRange = (startAt, endAt) => {
  if (!startAt || !endAt) return '—';
  return `${formatDate(startAt)}, ${formatTime(startAt)} – ${formatTime(endAt)}`;
};

export const isUpcoming = (dateString) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  return d.getTime() >= Date.now();
};
