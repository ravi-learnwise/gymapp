import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../decorators/current-user.decorator';

export async function assertMemberAccess(
  prisma: PrismaService,
  memberId: string,
  user: AuthUser,
) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { memberships: { select: { trainerId: true } } },
  });
  if (!member) throw new NotFoundException('Member not found');

  if (user.role === UserRole.TRAINER) {
    const assigned = member.memberships.some((m) => m.trainerId === user.id);
    if (!assigned) throw new ForbiddenException('Not assigned to this member');
  }

  return member;
}
