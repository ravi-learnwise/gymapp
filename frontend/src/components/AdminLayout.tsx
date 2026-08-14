import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Percent,
  Tag,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

type NavItem = {
  to: string;
  label: string;
  roles: string[];
  icon: LucideIcon;
  requiresAttendance?: boolean;
};

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', roles: ['OWNER', 'MANAGER', 'TRAINER'], icon: LayoutDashboard },
  { to: '/enquiries', label: 'Enquiries', roles: ['OWNER', 'MANAGER'], icon: MessageSquare },
  { to: '/members', label: 'Members', roles: ['OWNER', 'MANAGER', 'TRAINER'], icon: Users },
  { to: '/members/expiring', label: 'Renewals', roles: ['OWNER', 'MANAGER'], icon: CalendarClock },
  { to: '/payments', label: 'Payments', roles: ['OWNER', 'MANAGER'], icon: CreditCard },
  { to: '/attendance', label: 'Attendance', roles: ['OWNER', 'MANAGER'], icon: ClipboardCheck, requiresAttendance: true },
  { to: '/reports', label: 'Reports', roles: ['OWNER', 'MANAGER'], icon: BarChart3 },
  { to: '/config/gym', label: 'Gym Info', roles: ['OWNER', 'MANAGER'], icon: Building2 },
  { to: '/config/programs', label: 'Programs', roles: ['OWNER', 'MANAGER'], icon: Dumbbell },
  { to: '/config/discounts', label: 'Discounts', roles: ['OWNER', 'MANAGER'], icon: Percent },
  { to: '/config/offers', label: 'Offers', roles: ['OWNER', 'MANAGER'], icon: Tag },
  { to: '/users', label: 'Users', roles: ['OWNER'], icon: UserCog },
  { to: '/profile', label: 'Profile', roles: ['OWNER', 'MANAGER', 'TRAINER'], icon: User },
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
      (!item.requiresAttendance || attendanceEnabled),
  );

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300">
      <header className="sticky top-0 z-30 border-b border-slate-300/80 bg-white/95 px-4 py-3 shadow-md shadow-slate-400/20 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="btn btn-secondary !px-3 !py-2.5"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-900/30">
              <Dumbbell className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg text-slate-900">GymApp</h1>
              <p className="truncate text-xs font-semibold capitalize text-slate-500">
                {user?.role?.toLowerCase()} portal
              </p>
            </div>
          </div>
          <p className="hidden truncate text-xs font-medium text-slate-500 sm:block">{user?.email}</p>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px]"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        id="main-nav"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-in-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-4">
          <div>
            <h2 className="text-lg text-slate-900">GymApp</h2>
            <p className="text-xs font-semibold capitalize text-slate-500">{user?.role?.toLowerCase()}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="btn btn-ghost !p-2"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-900/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <p className="truncate px-3 text-xs font-medium text-slate-500">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-danger mt-2 w-full !justify-start"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="p-4 sm:p-6">
        <div className="page-panel mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
