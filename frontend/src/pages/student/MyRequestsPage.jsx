import React from 'react';
import PageHeader from '../../components/ui/PageHeader';

export const MyRequestsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Event Requests"
        description="Track the status of all past and pending event requests submitted by your account."
      />
      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          Request History Stub
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Paginated request tables with status badges and filter controls will be implemented in subsequent batches.
        </p>
      </div>
    </div>
  );
};

export default MyRequestsPage;
