import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../lib/api';
import { hasRoleAccess } from '../lib/roles';

type Props = {
  roles?: UserRole[];
};

export default function ProtectedRoute({ roles }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-secondary">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !hasRoleAccess(user.role, roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
