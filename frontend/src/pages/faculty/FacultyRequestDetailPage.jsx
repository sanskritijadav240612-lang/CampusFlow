import React from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';

export const FacultyRequestDetailPage = () => {
  const { requestId } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Request & Conflict Analysis"
        description={`Conflict inspection and atomic approval control for request: ${requestId}`}
      />
      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          Conflict Detection & Decision Engine Stub
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Overlapping allocation matrices, competing request warnings, and atomic approval controls will be mounted in future batches.
        </p>
      </div>
    </div>
  );
};

export default FacultyRequestDetailPage;
