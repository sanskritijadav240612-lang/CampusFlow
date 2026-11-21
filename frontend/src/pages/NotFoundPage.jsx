import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-lg border border-surface-border shadow-soft">
        <span className="text-xs font-bold text-campus-700 uppercase tracking-widest block mb-2">
          404 Not Found
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Page Does Not Exist
        </h1>
        <p className="text-xs text-slate-600 mb-6">
          The requested campus page could not be located. It may have moved or the address is incorrect.
        </p>
        <Link to="/">
          <Button variant="primary" size="sm">
            Return to CampusFlow Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
