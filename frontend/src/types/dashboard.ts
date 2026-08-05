export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ReportType =
  | 'financial'
  | 'enquiries'
  | 'enrollments'
  | 'payments'
  | 'attendance'
  | 'referrals';

export type DashboardSummary = {
  period: ReportPeriod;
  activeMembers: number;
  newEnquiries: number;
  conversionRate: number;
  revenue?: number;
  transactionCount?: number;
  revenueByProgram?: { programId: string; programName: string; revenue: number; count: number }[];
  pendingPayments: number;
  programEnrollments: { programName: string; count: number }[];
  renewalRate: number;
  renewedCount: number;
  expiredCount: number;
  attendanceEnabled: boolean;
  attendanceTrend: { date: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  inactiveMemberCount: number;
};

export const PERIOD_LABELS: Record<ReportPeriod, string> = {
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
  yearly: 'This Year',
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  financial: 'Financial',
  enquiries: 'Enquiries',
  enrollments: 'Enrollments',
  payments: 'Payments',
  attendance: 'Attendance',
  referrals: 'Referrals',
};
