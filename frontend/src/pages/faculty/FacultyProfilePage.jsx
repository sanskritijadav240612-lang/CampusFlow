import React from 'react';
import PageHeader from '../../components/ui/PageHeader';

export const FacultyProfilePage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Administration Profile"
        description="View your institutional faculty account details and active administrative credentials."
      />
      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          Faculty Profile Stub
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Faculty ID identification and session controls will be connected in future batches.
        </p>
      </div>
    </div>
  );
};

export default FacultyProfilePage;
