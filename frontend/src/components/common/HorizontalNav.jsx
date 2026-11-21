import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Menu, X, User } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * HorizontalNav component for authenticated dashboards (Student & Faculty).
 * - Full horizontal desktop navigation with active state indicators.
 * - Collapsible mobile menu.
 * - Role-specific badges and profile trigger.
 */
export const HorizontalNav = ({ roleTitle, navItems = [], userEmail = 'user@campus.edu' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Product Identity & Role Tag */}
          <div className="flex items-center gap-6">
            <Link to={navItems[0]?.to || '/'} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-campus-700 text-white flex items-center justify-center font-bold shadow-soft group-hover:bg-campus-800 transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                  CampusFlow
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-campus-700 block leading-tight">
                  {roleTitle}
                </span>
              </div>
            </Link>

            {/* Desktop Horizontal Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.to ||
                  (item.to !== '/student' && item.to !== '/faculty' && location.pathname.startsWith(item.to));

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-campus-50 text-campus-800 font-semibold border-b-2 border-campus-700 rounded-b-none'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: User Profile Indicator & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 pl-4 border-l border-surface-border">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-200">
                <User className="w-4 h-4" />
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-800 block leading-tight">
                  {roleTitle} Account
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  {userEmail}
                </span>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-border bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/student' && item.to !== '/faculty' && location.pathname.startsWith(item.to));

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-campus-50 text-campus-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default HorizontalNav;
