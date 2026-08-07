import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', roles: ['OWNER', 'MANAGER', 'TRAINER'] },
  { to: '/enquiries', label: 'Enquiries', roles: ['OWNER', 'MANAGER'] },
  { to: '/members', label: 'Members', roles: ['OWNER', 'MANAGER', 'TRAINER'] },
  { to: '/members/expiring', label: 'Renewals', roles: ['OWNER', 'MANAGER'] },
  { to: '/payments', label: 'Payments', roles: ['OWNER', 'MANAGER'] },
  { to: '/attendance', label: 'Attendance', roles: ['OWNER', 'MANAGER'], requiresAttendance: true },
  { to: '/reports', label: 'Reports', roles: ['OWNER', 'MANAGER'] },
  { to: '/config/gym', label: 'Gym Info', roles: ['OWNER', 'MANAGER'] },
  { to: '/config/programs', label: 'Programs', roles: ['OWNER', 'MANAGER'] },
  { to: '/config/discounts', label: 'Discounts', roles: ['OWNER', 'MANAGER'] },
  { to: '/config/offers', label: 'Offers', roles: ['OWNER', 'MANAGER'] },
  { to: '/users', label: 'Users', roles: ['OWNER'] },
  { to: '/profile', label: 'Profile', roles: ['OWNER', 'MANAGER', 'TRAINER'] },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [attendanceEnabled, setAttendanceEnabled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'OWNER' || user?.role === 'MANAGER') {
      api<{ enabled: boolean }>('/attendance/enabled')
        .then((r) => setAttendanceEnabled(r.enabled))
        .catch(() => setAttendanceEnabled(false));
    }
  }, [user]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const visibleNav = navItems.filter(
    (item) =>
      user &&
      item.roles.includes(user.role) &&
      (!('requiresAttendance' in item && item.requiresAttendance) || attendanceEnabled),
  );

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-slate-900">GymApp</h1>
          <p className="truncate text-xs capitalize text-slate-500">
            {user?.role?.toLowerCase()} portal
          </p>
        </div>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{user?.email}</p>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        id="main-nav"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-in-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Menu</h2>
            <p className="text-xs capitalize text-slate-500">{user?.role?.toLowerCase()} portal</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <p className="truncate px-3 text-xs text-slate-500">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
