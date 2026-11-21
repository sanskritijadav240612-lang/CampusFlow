import React from 'react';
import PageHeader from '../../components/ui/PageHeader';

export const StudentProfilePage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        description="Manage your institutional student details and active session."
      />
      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          Student Profile Stub
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Account details, enrollment verification, and session logout will be wired in future batches.
        </p>
      </div>
    </div>
  );
};

export default StudentProfilePage;
