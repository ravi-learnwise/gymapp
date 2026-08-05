import { ForbiddenException, Injectable } from '@nestjs/common';
import { EnquiryStatus, LeadSource, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { periodRange, ReportPeriod } from '../common/utils/period.util';
import { toNumber } from '../payment/payment.util';
import { AttendanceService } from '../attendance/attendance.service';
import { DashboardQueryDto, ReportQueryDto, ReportType } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
  ) {}

  async getSummary(query: DashboardQueryDto, user: AuthUser) {
    if (user.role === UserRole.TRAINER) {
      throw new ForbiddenException('Trainers do not have dashboard access');
    }

    const period = (query.period ?? 'monthly') as ReportPeriod;
    const { start, end } = periodRange(period);

    const [
      activeMembers,
      newEnquiries,
      enquiryStats,
      revenueAgg,
      revenueByProgram,
      pendingPayments,
      programEnrollments,
      renewalStats,
      attendanceEnabled,
    ] = await Promise.all([
      this.prisma.membership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.enquiry.count({
        where: { dateOfEnquiry: { gte: start, lte: end } },
      }),
      this.getConversionRate(start, end),
      this.prisma.paymentTransaction.aggregate({
        where: { paymentDate: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
      this.getRevenueByProgram(start, end),
      this.prisma.paymentCommitment.count({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
      }),
      this.getProgramEnrollments(start, end),
      this.getRenewalRate(),
      this.attendanceService.isEnabled(),
    ]);

    let attendance: Awaited<ReturnType<AttendanceService['getAnalytics']>> | null = null;
    if (attendanceEnabled.enabled) {
      attendance = await this.attendanceService.getAnalytics({ period });
    }

    const includeFinancial = user.role === UserRole.OWNER;

    return {
      period,
      activeMembers,
      newEnquiries,
      conversionRate: enquiryStats.conversionRate,
      ...(includeFinancial
        ? {
            revenue: toNumber(revenueAgg._sum.amount ?? 0),
            transactionCount: revenueAgg._count,
            revenueByProgram,
          }
        : {}),
      pendingPayments,
      programEnrollments,
      renewalRate: renewalStats.renewalRate,
      renewedCount: renewalStats.renewedCount,
      expiredCount: renewalStats.expiredCount,
      attendanceEnabled: attendanceEnabled.enabled,
      attendanceTrend: attendance?.dailyTrend ?? [],
      peakHours: attendance?.peakHours ?? [],
      inactiveMemberCount: attendance?.inactiveCount ?? 0,
    };
  }

  async getReport(query: ReportQueryDto, user: AuthUser) {
    if (user.role === UserRole.TRAINER) {
      throw new ForbiddenException('Trainers do not have report access');
    }

    const period = (query.period ?? 'monthly') as ReportPeriod;
    const type = query.type ?? ReportType.ENQUIRIES;
    const { start, end } = periodRange(period);

    if (type === ReportType.FINANCIAL && user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Financial reports are owner-only');
    }

    switch (type) {
      case ReportType.FINANCIAL:
        return this.financialReport(start, end, period);
      case ReportType.ENQUIRIES:
        return this.enquiriesReport(start, end, period);
      case ReportType.ENROLLMENTS:
        return this.enrollmentsReport(start, end, period);
      case ReportType.PAYMENTS:
        return this.paymentsReport(start, end, period);
      case ReportType.ATTENDANCE:
        return this.attendanceReport(period);
      case ReportType.REFERRALS:
        return this.referralsReport(start, end, period);
      default:
        return this.enquiriesReport(start, end, period);
    }
  }

  private async getConversionRate(start: Date, end: Date) {
    const [converted, lost] = await Promise.all([
      this.prisma.enquiry.count({
        where: { status: EnquiryStatus.CONVERTED, updatedAt: { gte: start, lte: end } },
      }),
      this.prisma.enquiry.count({
        where: { status: EnquiryStatus.LOST, updatedAt: { gte: start, lte: end } },
      }),
    ]);
    const closed = converted + lost;
    return {
      converted,
      lost,
      conversionRate: closed > 0 ? Math.round((converted / closed) * 10000) / 100 : 0,
    };
  }

  private async getRevenueByProgram(start: Date, end: Date) {
    const transactions = await this.prisma.paymentTransaction.findMany({
      where: { paymentDate: { gte: start, lte: end } },
      include: {
        commitment: {
          include: {
            membership: { include: { program: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    const map = new Map<string, { programId: string; programName: string; revenue: number; count: number }>();
    for (const t of transactions) {
      const program = t.commitment.membership.program;
      const existing = map.get(program.id) ?? {
        programId: program.id,
        programName: program.name,
        revenue: 0,
        count: 0,
      };
      existing.revenue += toNumber(t.amount);
      existing.count += 1;
      map.set(program.id, existing);
    }

    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }

  private async getProgramEnrollments(start: Date, end: Date) {
    const rows = await this.prisma.enrollment.groupBy({
      by: ['membershipId'],
      where: { enrolledAt: { gte: start, lte: end } },
      _count: true,
    });

    const memberships = await this.prisma.membership.findMany({
      where: { id: { in: rows.map((r) => r.membershipId) } },
      include: { program: { select: { name: true } } },
    });

    const programMap = new Map<string, { programName: string; count: number }>();
    for (const m of memberships) {
      const existing = programMap.get(m.programId) ?? { programName: m.program.name, count: 0 };
      existing.count += 1;
      programMap.set(m.programId, existing);
    }

    return [...programMap.values()].sort((a, b) => b.count - a.count);
  }

  private async getRenewalRate() {
    const expired = await this.prisma.membership.findMany({
      where: { status: 'EXPIRED' },
      select: { memberId: true, endDate: true },
    });

    if (expired.length === 0) {
      return { renewalRate: 0, renewedCount: 0, expiredCount: 0 };
    }

    let renewedCount = 0;
    for (const m of expired) {
      const renewal = await this.prisma.membership.findFirst({
        where: {
          memberId: m.memberId,
          startDate: { gt: m.endDate },
        },
      });
      if (renewal) renewedCount += 1;
    }

    return {
      renewalRate: Math.round((renewedCount / expired.length) * 10000) / 100,
      renewedCount,
      expiredCount: expired.length,
    };
  }

  private async financialReport(start: Date, end: Date, period: ReportPeriod) {
    const [transactions, revenueByProgram, outstanding] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where: { paymentDate: { gte: start, lte: end } },
        include: {
          commitment: {
            include: {
              member: { select: { fullName: true, memberNumber: true } },
              membership: { include: { program: { select: { name: true } } } },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      this.getRevenueByProgram(start, end),
      this.prisma.paymentCommitment.aggregate({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        _sum: { pendingAmount: true },
      }),
    ]);

    const totalRevenue = transactions.reduce((sum, t) => sum + toNumber(t.amount), 0);

    return {
      period,
      start: start.toISOString(),
      end: end.toISOString(),
      totalRevenue,
      transactionCount: transactions.length,
      revenueByProgram,
      outstandingAmount: toNumber(outstanding._sum.pendingAmount ?? 0),
      transactions: transactions.map((t) => ({
        id: t.id,
        receiptNumber: t.receiptNumber,
        amount: toNumber(t.amount),
        paymentMode: t.paymentMode,
        paymentDate: t.paymentDate,
        member: t.commitment.member.fullName,
        memberNumber: t.commitment.member.memberNumber,
        program: t.commitment.membership.program.name,
      })),
    };
  }

  private async enquiriesReport(start: Date, end: Date, period: ReportPeriod) {
    const [total, byStatus, newInPeriod] = await Promise.all([
      this.prisma.enquiry.count(),
      this.prisma.enquiry.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.enquiry.findMany({
        where: { dateOfEnquiry: { gte: start, lte: end } },
        select: {
          id: true,
          enquiryNumber: true,
          fullName: true,
          status: true,
          leadSource: true,
          dateOfEnquiry: true,
        },
        orderBy: { dateOfEnquiry: 'desc' },
      }),
    ]);

    const conversion = await this.getConversionRate(start, end);

    return {
      period,
      start: start.toISOString(),
      end: end.toISOString(),
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
      newInPeriod: newInPeriod.length,
      items: newInPeriod,
      conversionRate: conversion.conversionRate,
    };
  }

  private async enrollmentsReport(start: Date, end: Date, period: ReportPeriod) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { enrolledAt: { gte: start, lte: end } },
      include: {
        member: { select: { fullName: true, memberNumber: true } },
        membership: { include: { program: { select: { name: true } } } },
        enrolledBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return {
      period,
      start: start.toISOString(),
      end: end.toISOString(),
      total: enrollments.length,
      byProgram: await this.getProgramEnrollments(start, end),
      items: enrollments.map((e) => ({
        id: e.id,
        enrollmentNumber: e.enrollmentNumber,
        enrolledAt: e.enrolledAt,
        member: e.member.fullName,
        memberNumber: e.member.memberNumber,
        program: e.membership.program.name,
        enrolledBy: [e.enrolledBy.firstName, e.enrolledBy.lastName].filter(Boolean).join(' '),
      })),
    };
  }

  private async paymentsReport(start: Date, end: Date, period: ReportPeriod) {
    const commitments = await this.prisma.paymentCommitment.findMany({
      where: { updatedAt: { gte: start, lte: end } },
      include: {
        member: { select: { fullName: true, memberNumber: true } },
        membership: { include: { program: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const summary = {
      pending: commitments.filter((c) => c.status === 'PENDING').length,
      partial: commitments.filter((c) => c.status === 'PARTIAL').length,
      paid: commitments.filter((c) => c.status === 'PAID').length,
    };

    return {
      period,
      start: start.toISOString(),
      end: end.toISOString(),
      summary,
      items: commitments.map((c) => ({
        id: c.id,
        status: c.status,
        finalAmount: toNumber(c.finalAmount),
        amountPaid: toNumber(c.amountPaid),
        pendingAmount: toNumber(c.pendingAmount),
        member: c.member.fullName,
        memberNumber: c.member.memberNumber,
        program: c.membership.program.name,
      })),
    };
  }

  private async attendanceReport(period: ReportPeriod) {
    const enabled = await this.attendanceService.isEnabled();
    if (!enabled.enabled) {
      return { period, enabled: false, message: 'Attendance module is disabled' };
    }
    const analytics = await this.attendanceService.getAnalytics({ period });
    return { enabled: true, ...analytics };
  }

  private async referralsReport(start: Date, end: Date, period: ReportPeriod) {
    const referrals = await this.prisma.enquiry.findMany({
      where: {
        leadSource: LeadSource.REFERRAL,
        dateOfEnquiry: { gte: start, lte: end },
      },
      select: {
        id: true,
        enquiryNumber: true,
        fullName: true,
        status: true,
        dateOfEnquiry: true,
      },
      orderBy: { dateOfEnquiry: 'desc' },
    });

    const converted = referrals.filter((r) => r.status === EnquiryStatus.CONVERTED).length;

    return {
      period,
      start: start.toISOString(),
      end: end.toISOString(),
      total: referrals.length,
      converted,
      conversionRate:
        referrals.length > 0
          ? Math.round((converted / referrals.length) * 10000) / 100
          : 0,
      items: referrals,
    };
  }
}
