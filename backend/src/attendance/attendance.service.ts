import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { assertMemberAccess } from '../common/utils/member-access.util';
import { periodRange, ReportPeriod } from '../common/utils/period.util';
import {
  AttendanceAnalyticsQueryDto,
  AttendanceQueryDto,
  CheckInDto,
} from './dto/attendance.dto';

const recordInclude = {
  member: { select: { id: true, memberNumber: true, fullName: true, mobileNumber: true } },
  recordedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
};

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private async requireEnabled() {
    const config = await this.prisma.gymConfig.findFirst();
    if (!config?.attendanceEnabled) {
      throw new ForbiddenException('Attendance module is disabled');
    }
    return config;
  }

  async isEnabled() {
    const config = await this.prisma.gymConfig.findFirst();
    return { enabled: config?.attendanceEnabled ?? false };
  }

  async findAll(query: AttendanceQueryDto, user: AuthUser) {
    await this.requireEnabled();

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceRecordWhereInput = {};

    if (user.role === UserRole.TRAINER) {
      where.member = { memberships: { some: { trainerId: user.id, status: 'ACTIVE' } } };
    }

    if (query.memberId) {
      await assertMemberAccess(this.prisma, query.memberId, user);
      where.memberId = query.memberId;
    }

    if (query.date) {
      const dayStart = new Date(query.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(query.date);
      dayEnd.setHours(23, 59, 59, 999);
      where.checkIn = { gte: dayStart, lte: dayEnd };
    }

    const [items, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        include: recordInclude,
        orderBy: { checkIn: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async checkIn(dto: CheckInDto, user: AuthUser) {
    await this.requireEnabled();
    if (user.role === UserRole.TRAINER) {
      throw new ForbiddenException('Trainers cannot record attendance');
    }

    await assertMemberAccess(this.prisma, dto.memberId, user);

    const open = await this.prisma.attendanceRecord.findFirst({
      where: { memberId: dto.memberId, checkOut: null },
    });
    if (open) {
      throw new BadRequestException('Member already checked in');
    }

    return this.prisma.attendanceRecord.create({
      data: {
        memberId: dto.memberId,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : new Date(),
        batch: dto.batch,
        recordedById: user.id,
      },
      include: recordInclude,
    });
  }

  async checkOut(id: string, user: AuthUser) {
    await this.requireEnabled();
    if (user.role === UserRole.TRAINER) {
      throw new ForbiddenException('Trainers cannot record attendance');
    }

    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: { member: true },
    });
    if (!record) throw new NotFoundException('Attendance record not found');
    if (record.checkOut) throw new BadRequestException('Already checked out');

    const checkOut = new Date();
    const sessionMinutes = Math.round(
      (checkOut.getTime() - record.checkIn.getTime()) / 60000,
    );

    return this.prisma.attendanceRecord.update({
      where: { id },
      data: { checkOut, sessionMinutes },
      include: recordInclude,
    });
  }

  async getAnalytics(query: AttendanceAnalyticsQueryDto) {
    await this.requireEnabled();

    const period = (query.period ?? 'monthly') as ReportPeriod;
    const { start, end } = periodRange(period);

    const records = await this.prisma.attendanceRecord.findMany({
      where: { checkIn: { gte: start, lte: end } },
      select: { checkIn: true, memberId: true },
    });

    const dailyMap = new Map<string, number>();
    const hourMap = new Map<number, number>();
    const memberSet = new Set<string>();

    for (const r of records) {
      const day = r.checkIn.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
      hourMap.set(r.checkIn.getHours(), (hourMap.get(r.checkIn.getHours()) ?? 0) + 1);
      memberSet.add(r.memberId);
    }

    const dailyTrend = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const peakHours = [...hourMap.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([hour, count]) => ({ hour, count }));

    const activeMembers = await this.prisma.member.count({ where: { isActive: true } });
    const attendedCount = memberSet.size;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAttendees = await this.prisma.attendanceRecord.findMany({
      where: { checkIn: { gte: thirtyDaysAgo } },
      select: { memberId: true },
      distinct: ['memberId'],
    });
    const recentAttendeeIds = new Set(recentAttendees.map((r) => r.memberId));

    const activeWithMembership = await this.prisma.member.findMany({
      where: {
        isActive: true,
        memberships: { some: { status: 'ACTIVE' } },
      },
      select: { id: true, fullName: true, memberNumber: true },
    });

    const inactiveMembers = activeWithMembership.filter((m) => !recentAttendeeIds.has(m.id));

    return {
      period,
      totalCheckIns: records.length,
      uniqueMembers: attendedCount,
      dailyTrend,
      peakHours,
      inactiveMembers: inactiveMembers.slice(0, 20),
      inactiveCount: inactiveMembers.length,
      attendanceRate:
        activeMembers > 0
          ? Math.round((attendedCount / activeMembers) * 10000) / 100
          : 0,
    };
  }
}
