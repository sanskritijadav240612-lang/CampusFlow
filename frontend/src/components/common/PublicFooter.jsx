import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export const PublicFooter = () => {
  return (
    <footer className="border-t border-surface-border bg-white text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-campus-700 text-white flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900">CampusFlow</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Smart Campus Event & Resource Management System. Deterministic scheduling, AI assistance, and institutional approvals.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-slate-500 hover:text-slate-900 transition-colors">
                  AI Coordination
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Operational Workflow
                </a>
              </li>
              <li>
                <a href="#resources" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Resource Catalog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link to="/faculty/login" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Faculty Administration
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Security & Compliance
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Protected by HTTP-only rotating sessions, RBAC permission guards, and atomic database transaction locks.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>&copy; {new Date().getFullYear()} CampusFlow System. All rights reserved.</div>
          <div className="flex gap-4">
            <span>Enterprise MERN Architecture</span>
            <span>&bull;</span>
            <span>Institutional University Edition</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
