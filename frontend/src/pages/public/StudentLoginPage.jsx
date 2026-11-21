import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

export const StudentLoginPage = () => {
  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white p-8 rounded-lg border border-surface-border shadow-soft">
        <PageHeader
          title="Student Sign In"
          description="Enter your college email and password to access the student portal."
        />
        <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 mb-6">
          Authentication logic and form validation will be connected in Frontend Batch 2.
        </div>
        <div className="space-y-4">
          <Link to="/student" className="block">
            <Button variant="primary" className="w-full">
              Go to Student Portal (Dev Preview)
            </Button>
          </Link>
          <p className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-campus-700 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLoginPage;
