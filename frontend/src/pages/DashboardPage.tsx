import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  IndianRupee,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { monthToDateRange } from '../lib/date-range';
import StatCard from '../components/ui/StatCard';
import { PERIOD_LABELS, type DashboardSummary, type ReportPeriod } from '../types/dashboard';
import type { EnquiryStats } from '../types/enquiry';
import type { ExpiringMembershipResponse } from '../types/member';

const PERIODS: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [enquiryStats, setEnquiryStats] = useState<EnquiryStats | null>(null);
  const [expiring, setExpiring] = useState<ExpiringMembershipResponse | null>(null);

  useEffect(() => {
    if (user?.role === 'OWNER' || user?.role === 'MANAGER') {
      api<DashboardSummary>(`/dashboard/summary?period=${period}`)
        .then(setSummary)
        .catch(() => setSummary(null));

      const mtd = monthToDateRange();
      api<EnquiryStats>(`/enquiries/stats?dateFrom=${mtd.dateFrom}&dateTo=${mtd.dateTo}`)
        .then(setEnquiryStats)
        .catch(() => setEnquiryStats(null));

      api<ExpiringMembershipResponse>('/memberships/expiring?limit=1')
        .then(setExpiring)
        .catch(() => setExpiring(null));
    }
  }, [user, period]);

  if (user?.role === 'TRAINER') {
    return (
      <div>
        <PageHeader title="Trainer Portal" subtitle="Your member assignments and assessments" />
        <div className="page-section mt-6">
          <div className="flex items-start gap-4">
            <div className="stat-card-icon">
              <Users className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div>
              <p className="font-medium text-ink">Your assigned members</p>
              <p className="mt-1 text-sm text-ink-muted">
                View members assigned to you and their fitness assessments.
              </p>
              <Link to="/members" className="btn btn-primary mt-4">
                My Members
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxProgramRevenue = summary?.revenueByProgram?.length
    ? Math.max(...summary.revenueByProgram.map((p) => p.revenue), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Dashboard" subtitle="Overview of your gym performance" />
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="dashboard-period" className="sr-only">Date range</label>
            <select
              id="dashboard-period"
              className="select-field min-w-[10rem]"
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <Link to="/reports" className="btn btn-secondary">
            <BarChart3 className="h-4 w-4" />
            Reports
          </Link>
        </div>
      </div>

      {!summary && (
        <p className="text-sm text-ink-muted">Loading dashboard…</p>
      )}

      {summary && (
        <>
          {/* KPI cards — soft tinted surfaces per metric */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Active Members" value={summary.activeMembers} icon={Users} tone="blue" />
            <StatCard title="Pending Payments" value={summary.pendingPayments} icon={Wallet} tone="amber" />
            <StatCard
              title="New Enquiries"
              value={enquiryStats?.newEnquiries ?? '—'}
              icon={MessageSquare}
              tone="cyan"
              note={enquiryStats ? 'Month to date' : undefined}
            />
            <StatCard
              title="Converted"
              value={enquiryStats?.converted ?? '—'}
              icon={UserCheck}
              tone="emerald"
              note={enquiryStats ? 'Month to date' : undefined}
            />
            <StatCard
              title="Lost"
              value={enquiryStats?.lost ?? '—'}
              icon={UserX}
              tone="rose"
              note={enquiryStats ? 'Month to date' : undefined}
            />
            <StatCard
              title="Open Enquiries"
              value={enquiryStats?.openRemaining ?? '—'}
              icon={TrendingUp}
              tone="indigo"
              note={enquiryStats ? `${enquiryStats.dateFrom} → ${enquiryStats.dateTo}` : undefined}
            />
          </div>

          {/* Membership renewals */}
          {expiring && (
            <section className="page-section">
              <SectionHeader
                title="Membership Renewals"
                icon={CalendarClock}
                action={
                  <Link to="/members/expiring" className="btn-link text-sm">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <RenewalBlock label="Within 7 Days" count={expiring.summary.within7} bucket="7" variant="urgent" />
                <RenewalBlock label="Within 15 Days" count={expiring.summary.within15} bucket="15" variant="warning" />
                <RenewalBlock label="Within 30 Days" count={expiring.summary.within30} bucket="30" variant="neutral" />
                <RenewalBlock label="Beyond 30 Days" count={expiring.summary.beyond30} bucket="beyond" variant="safe" />
              </div>
            </section>
          )}

          {/* Revenue */}
          {user?.role === 'OWNER' && summary.revenue != null && (
            <section className="page-section">
              <SectionHeader title="Revenue" icon={IndianRupee} />
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-line bg-white p-5 lg:col-span-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    Revenue ({PERIOD_LABELS[period]})
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-ink">
                    ₹{summary.revenue.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">
                    {summary.transactionCount ?? 0} transactions collected
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-white p-5 lg:col-span-1">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Renewal Rate</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{summary.renewalRate}%</p>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    {summary.renewedCount} of {summary.expiredCount} expired memberships renewed
                  </p>
                </div>
                {summary.revenueByProgram && summary.revenueByProgram.length > 0 && (
                  <div className="rounded-xl border border-line bg-white p-5 lg:col-span-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Top Program</p>
                    <p className="mt-2 text-lg font-semibold text-ink">
                      {summary.revenueByProgram[0].programName}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      ₹{summary.revenueByProgram[0].revenue.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>

              {summary.revenueByProgram && summary.revenueByProgram.length > 0 && (
                <div className="mt-4 rounded-xl border border-line bg-canvas/50 p-4">
                  <h4 className="text-sm font-medium text-ink">Revenue by Program</h4>
                  <ul className="mt-3 space-y-3">
                    {summary.revenueByProgram.map((p) => (
                      <li key={p.programId}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-ink-muted">{p.programName}</span>
                          <span className="font-medium text-ink">₹{p.revenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-brand-100">
                          <div
                            className="h-full rounded-full bg-brand-600 transition-all"
                            style={{ width: `${(p.revenue / maxProgramRevenue) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Other analytics */}
          {summary.programEnrollments.length > 0 && (
            <section className="page-section">
              <SectionHeader title="Program Enrollments" icon={Users} />
              <ul className="mt-3 divide-y divide-line">
                {summary.programEnrollments.map((p) => (
                  <li key={p.programName} className="flex justify-between py-2.5 text-sm first:pt-0 last:pb-0">
                    <span className="text-ink-muted">{p.programName}</span>
                    <span className="font-medium text-ink">{p.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.attendanceEnabled && summary.attendanceTrend.length > 0 && (
            <section className="page-section">
              <SectionHeader
                title="Attendance"
                icon={ClipboardCheck}
                action={
                  <Link to="/attendance" className="btn-link text-sm">
                    Manage <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-muted">
                <span>{summary.inactiveMemberCount} inactive members (30+ days)</span>
                {summary.peakHours.length > 0 && (
                  <span>
                    Peak: {summary.peakHours[0].hour}:00 ({summary.peakHours[0].count} check-ins)
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-1.5">
                {summary.attendanceTrend.slice(-14).map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count}`}
                    className="flex h-16 w-6 flex-col items-center justify-end rounded bg-brand-50"
                  >
                    <div
                      className="w-full rounded-sm bg-brand-600"
                      style={{ height: `${Math.min(d.count * 6, 48)}px` }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
    </div>
  );
}

function SectionHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-[18px] w-[18px] text-brand-600" strokeWidth={2} />
        <h3 className="text-base font-semibold text-ink">{title}</h3>
      </div>
      {action}
    </div>
  );
}

type RenewalVariant = 'urgent' | 'warning' | 'neutral' | 'safe';

const renewalStyles: Record<RenewalVariant, { border: string; count: string; icon: string }> = {
  urgent: { border: 'border-warning/50', count: 'text-ink', icon: 'text-warning' },
  warning: { border: 'border-line', count: 'text-ink', icon: 'text-warning' },
  neutral: { border: 'border-line', count: 'text-ink', icon: 'text-ink-muted' },
  safe: { border: 'border-line', count: 'text-ink', icon: 'text-success' },
};

function RenewalBlock({
  label,
  count,
  bucket,
  variant,
}: {
  label: string;
  count: number;
  bucket: string;
  variant: RenewalVariant;
}) {
  const s = renewalStyles[variant];
  return (
    <Link
      to={`/members/expiring?bucket=${bucket}`}
      className={`rounded-xl border bg-white p-4 transition-colors hover:bg-brand-50/40 ${s.border}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <CalendarClock className={`h-4 w-4 shrink-0 ${s.icon}`} />
      </div>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${s.count}`}>{count}</p>
    </Link>
  );
}
