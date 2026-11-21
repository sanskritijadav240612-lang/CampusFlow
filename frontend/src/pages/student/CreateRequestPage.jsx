import React from 'react';
import PageHeader from '../../components/ui/PageHeader';

export const CreateRequestPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Event Request"
        description="Collaborate with CampusFlow's AI event assistant to describe your requirements and draft a booking request."
      />
      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          AI Event Assistant Interface Stub
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Interactive chat session and automated resource availability verification will be connected in future batches.
        </p>
      </div>
    </div>
  );
};

export default CreateRequestPage;
