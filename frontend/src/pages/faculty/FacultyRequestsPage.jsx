import React from 'react';
import PageHeader from '../../components/ui/PageHeader';

export const FacultyRequestsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Request Inbox"
        description="Examine student event requests, detect overlapping resource claims, and make approval decisions."
      />
      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          Faculty Request Inbox Stub
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Request filtering by review status, search bar, and approval review dialogs will be added in future batches.
        </p>
      </div>
    </div>
  );
};

export default FacultyRequestsPage;
