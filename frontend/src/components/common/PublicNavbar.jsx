import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers } from 'lucide-react';
import Button from '../ui/Button';

export const PublicNavbar = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-campus-700 text-white flex items-center justify-center font-bold shadow-soft group-hover:bg-campus-800 transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                CampusFlow
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block leading-tight">
                Event & Resource Ops
              </span>
            </div>
          </Link>

          {/* Public Navigation Links & Actions */}
          <nav className="flex items-center gap-3">
            {location.pathname !== '/login' && (
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Student Portal
                </Button>
              </Link>
            )}
            {location.pathname !== '/faculty/login' && (
              <Link to="/faculty/login">
                <Button variant="outline" size="sm">
                  Faculty Access
                </Button>
              </Link>
            )}
            {location.pathname !== '/register' && (
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
