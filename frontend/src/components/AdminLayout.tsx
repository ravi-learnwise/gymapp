import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquare,
  Percent,
  Salad,
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
  { to: '/attendance', label: 'Attendance', roles: ['OWNER', 'MANAGER', 'TRAINER'], icon: ClipboardCheck, requiresAttendance: true },
  { to: '/reports', label: 'Reports', roles: ['OWNER', 'MANAGER'], icon: BarChart3 },
  { to: '/config/gym', label: 'Gym Info', roles: ['OWNER', 'MANAGER'], icon: Building2 },
  { to: '/config/programs', label: 'Programs', roles: ['OWNER', 'MANAGER'], icon: Dumbbell },
  { to: '/config/exercises', label: 'Exercise Library', roles: ['OWNER', 'MANAGER'], icon: ClipboardList },
  { to: '/config/training-templates', label: 'Training Plan Templates', roles: ['OWNER', 'MANAGER', 'TRAINER'], icon: LayoutTemplate },
  { to: '/config/diet-templates', label: 'Diet Plan Templates', roles: ['OWNER', 'MANAGER', 'TRAINER'], icon: Salad },
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
    if (user) {
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
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="btn btn-secondary !h-9 !w-9 !px-0"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
          >
            {menuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Dumbbell className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-ink">GymApp</h1>
              <p className="truncate text-xs capitalize text-ink-muted">
                {user?.role?.toLowerCase()} portal
              </p>
            </div>
          </div>
          <p className="hidden truncate text-xs text-ink-muted sm:block">{user?.email}</p>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[1px]"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        id="main-nav"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-white shadow-xl transition-transform duration-200 ease-in-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">GymApp</h2>
            <p className="text-xs capitalize text-ink-muted">{user?.role?.toLowerCase()}</p>
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
                  isActive ? 'nav-item nav-item-active' : 'nav-item'
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <p className="truncate px-3 text-xs text-ink-muted">{user?.email}</p>
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
