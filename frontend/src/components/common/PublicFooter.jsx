import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export const PublicFooter = () => {
  return (
    <footer className="border-t border-surface-border bg-white text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-campus-700 text-white flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-900">CampusFlow</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">
            Smart Campus Event & Resource Management System
          </span>
        </div>
        <div className="flex items-center gap-6 text-slate-500">
          <Link to="/login" className="hover:text-slate-900 transition-colors">
            Student Login
          </Link>
          <Link to="/faculty/login" className="hover:text-slate-900 transition-colors">
            Faculty Login
          </Link>
          <span>&copy; {new Date().getFullYear()} CampusFlow</span>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
