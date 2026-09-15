import { UserRole } from '@prisma/client';
import { AuthUser } from '../decorators/current-user.decorator';

const TRAINER_HIDDEN_FIELDS = [
  'mobileNumber',
  'alternateContact',
  'email',
  'address',
  'familyDetails',
  'profession',
] as const;

export function sanitizeMemberForUser<T extends Record<string, unknown>>(
  member: T,
  user: AuthUser,
): T {
  if (user.role !== UserRole.TRAINER) return member;
  const copy = { ...member };
  for (const field of TRAINER_HIDDEN_FIELDS) {
    delete copy[field];
  }
  return copy;
}

export function sanitizeMemberListItem<T extends Record<string, unknown>>(
  member: T,
  user: AuthUser,
): T {
  if (user.role !== UserRole.TRAINER) return member;
  const copy = { ...member };
  delete copy.mobileNumber;
  delete copy.email;
  delete copy.alternateContact;
  return copy;
}
