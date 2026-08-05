import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', roles: ['OWNER', 'MANAGER', 'TRAINER'] },
  { to: '/enquiries', label: 'Enquiries', roles: ['OWNER', 'MANAGER'] },
  { to: '/members', label: 'Members', roles: ['OWNER', 'MANAGER', 'TRAINER'] },
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
  const [attendanceEnabled, setAttendanceEnabled] = useState(false);

  useEffect(() => {
    if (user?.role === 'OWNER' || user?.role === 'MANAGER') {
      api<{ enabled: boolean }>('/attendance/enabled')
        .then((r) => setAttendanceEnabled(r.enabled))
        .catch(() => setAttendanceEnabled(false));
    }
  }, [user]);

  const visibleNav = navItems.filter(
    (item) =>
      user &&
      item.roles.includes(user.role) &&
      (!('requiresAttendance' in item && item.requiresAttendance) || attendanceEnabled),
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-5">
          <h1 className="text-lg font-bold text-slate-900">GymApp</h1>
          <p className="mt-0.5 text-xs text-slate-500 capitalize">
            {user?.role?.toLowerCase()} portal
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
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
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
