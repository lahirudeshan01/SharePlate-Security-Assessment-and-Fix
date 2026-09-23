import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isDashboardActive = location.pathname === '/dashboard';
  const isManageActive = location.pathname === '/manage-requests';
  const isDonationsActive = location.pathname === '/donations' || location.pathname === '/create-donation' || location.pathname.startsWith('/donations/');
  const isProfileActive = location.pathname === '/profile';
  const isPickupActive = location.pathname === '/pickup-management';

  const navItemClass = (isActive) =>
    [
      'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors md:text-base',
      isActive ? 'bg-[#e6f5ec] text-[#1b9d59]' : 'text-[#4b5563] hover:bg-[#f2f4f7]',
    ].join(' ');

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-20 bg-white/95 border-b border-[#e3e7ec] backdrop-blur">
      <div className="max-w-[1180px] mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 text-[1.85rem] font-semibold text-[#111827] md:text-[2rem]">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#0ea55b] text-white">
            <svg viewBox="0 0 24 24" width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Z" />
              <path d="M12 3v8m0 0 7.5-4M12 11 4.5 7" />
            </svg>
          </span>
          SharePlate
        </Link>

        <div className="flex gap-2 items-center text-sm md:text-base">
          {user && (
            <Link to="/dashboard" className={navItemClass(isDashboardActive)}>
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M4.2 9.8 8 13.6l7.8-7.8" />
                <rect x="2.5" y="2.5" width="15" height="15" rx="2.5" />
              </svg>
              Dashboard
            </Link>
          )}

          {/* Pickup Management - manager/admin only */}
          {isManager && (
            <Link to="/pickup-management" className={navItemClass(isPickupActive)}>
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="2" y="7" width="16" height="10" rx="2" />
                <path d="M5 7V5a3 3 0 0 1 6 0v2" />
                <circle cx="15" cy="5" r="2" />
              </svg>
              Pickup Management
            </Link>
          )}

          {/* Donor/shelter browse & manage */}
          {user && !isManager && (
            <Link to="/manage-requests" className={navItemClass(isManageActive)}>
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="3" width="14" height="14" rx="2.5" />
                <path d="M7 10h6M10 7v6" />
              </svg>
              {(user.role === 'donor' || user.role === 'restaurant') ? 'Manage Requests' : 'Browse & Requests'}
            </Link>
          )}

          {/* My Donations - donor only */}
          {(user?.role === 'donor' || user?.role === 'restaurant') && (
            <Link to="/donations" className={navItemClass(isDonationsActive)}>
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M10 4v12M4 10h12" />
              </svg>
              My Donations
            </Link>
          )}

          {user && (
            <Link to="/profile" className={navItemClass(isProfileActive)}>
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="10" cy="7" r="3.5" />
                <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" />
              </svg>
              Profile
            </Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="ml-2 bg-[#111827] hover:bg-[#1f2937] transition px-4 py-2 rounded-xl text-sm font-semibold text-white"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-2 bg-[#111827] hover:bg-[#1f2937] transition px-4 py-2 rounded-xl text-sm font-semibold text-white"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
