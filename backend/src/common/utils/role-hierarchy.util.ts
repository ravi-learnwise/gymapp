import { UserRole } from '@prisma/client';

const ROLE_RANK: Record<UserRole, number> = {
  TRAINER: 1,
  MANAGER: 2,
  OWNER: 3,
};

/** True when userRole meets or exceeds the minimum rank among required roles. */
export function hasRoleAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (!requiredRoles.length) return true;
  const minRequired = Math.min(...requiredRoles.map((r) => ROLE_RANK[r]));
  return ROLE_RANK[userRole] >= minRequired;
}

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}
