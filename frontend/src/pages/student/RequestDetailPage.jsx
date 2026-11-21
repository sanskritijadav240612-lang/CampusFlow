import React from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';

export const RequestDetailPage = () => {
  const { requestId } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Request Details"
        description={`Detailed schedule, resource breakdown, and administrative decision for request: ${requestId}`}
      />
      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          Request Breakdown View Stub
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Full allocation timetable and administrative feedback display will be mounted in upcoming batches.
        </p>
      </div>
    </div>
  );
};

export default RequestDetailPage;
