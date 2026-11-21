import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layers, Menu, X, User, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../ui/ConfirmDialog';

/**
 * HorizontalNav component for authenticated dashboards (Student & Faculty).
 * - Desktop horizontal navigation with active link highlighting.
 * - Collapsible mobile navigation menu.
 * - Real user profile identification.
 * - Interactive logout dialog.
 */
export const HorizontalNav = ({ roleTitle, navItems = [] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const displayName = user?.name || `${roleTitle} User`;
  const displayEmail = user?.email || 'user@campus.edu';
  const displayIdentifier = user?.enrollmentNumber || user?.facultyId || null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Identity & Role Tag */}
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

            {/* Right: User Profile & Logout Action */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-surface-border">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-200">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-800 block leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    {displayIdentifier ? `${displayIdentifier} &bull; ` : ''}
                    {displayEmail}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="ml-2 p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign out of CampusFlow"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile menu trigger button */}
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-surface-border bg-white px-4 pt-3 pb-4 space-y-1">
            <div className="pb-3 mb-2 border-b border-surface-border">
              <p className="text-xs font-semibold text-slate-900">{displayName}</p>
              <p className="text-[11px] text-slate-500">{displayEmail}</p>
            </div>

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

            <div className="pt-2 border-t border-surface-border">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Confirmation Dialog on Logout */}
      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out of CampusFlow"
        message="Are you sure you want to end your current session? You will need to sign in again to submit or review requests."
        confirmText="Sign Out"
        confirmVariant="danger"
        isLoading={isLoggingOut}
      />
    </>
  );
};

export default HorizontalNav;
