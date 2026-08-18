import type { UserRole } from '../lib/api';

const ROLE_RANK: Record<UserRole, number> = {
  TRAINER: 1,
  MANAGER: 2,
  OWNER: 3,
};

export function hasRoleAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (!requiredRoles.length) return true;
  const minRequired = Math.min(...requiredRoles.map((r) => ROLE_RANK[r]));
  return ROLE_RANK[userRole] >= minRequired;
}

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export function canManageConfig(userRole: UserRole): boolean {
  return hasMinRole(userRole, 'MANAGER');
}

export function canWriteConfig(userRole: UserRole): boolean {
  return userRole === 'OWNER';
}
