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
        <PageHeader
          title="Trainer Portal"
          subtitle={`Welcome back, ${user?.firstName || user?.email}`}
        />
        <div className="page-section mt-6 border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-violet-200/50 p-3 text-violet-700">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Your assigned members</p>
              <p className="mt-1 text-sm text-slate-600">
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

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${user?.firstName || user?.email}`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="select-field"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
          <Link to="/reports" className="btn btn-secondary">
            <BarChart3 className="h-4 w-4" />
            Reports
          </Link>
        </div>
      </div>

      {summary && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Active Members" value={summary.activeMembers} icon={Users} tone="blue" />
            <StatCard title="Pending Payments" value={summary.pendingPayments} icon={Wallet} tone="amber" />
            {enquiryStats && (
              <>
                <StatCard title="New Enquiries (MTD)" value={enquiryStats.newEnquiries} icon={MessageSquare} tone="emerald" />
                <StatCard title="Converted (MTD)" value={enquiryStats.converted} icon={UserCheck} tone="violet" />
              </>
            )}
          </div>

          {enquiryStats && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <StatCard title="Lost (MTD)" value={enquiryStats.lost} icon={UserX} tone="rose" />
              <StatCard
                title="Open in Period"
                value={enquiryStats.openRemaining}
                note={`${enquiryStats.dateFrom} → ${enquiryStats.dateTo}`}
                icon={TrendingUp}
                tone="slate"
              />
            </div>
          )}

          {expiring && (
            <div className="mt-8">
              <SectionHeader
                title="Membership Renewals"
                icon={CalendarClock}
                action={
                  <Link to="/members/expiring" className="btn-link text-sm">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <ExpiryCard label="Within 7 days" count={expiring.summary.within7} bucket="7" urgent />
                <ExpiryCard label="Within 15 days" count={expiring.summary.within15} bucket="15" />
                <ExpiryCard label="Within 30 days" count={expiring.summary.within30} bucket="30" />
                <ExpiryCard label="Beyond 30 days" count={expiring.summary.beyond30} bucket="beyond" />
              </div>
            </div>
          )}

          {user?.role === 'OWNER' && summary.revenue != null && (
            <div className="mt-8">
              <SectionHeader title="Revenue" icon={IndianRupee} />
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <StatCard
                  title={`Revenue (${PERIOD_LABELS[period]})`}
                  value={`₹${summary.revenue.toLocaleString('en-IN')}`}
                  note={`${summary.transactionCount ?? 0} transactions`}
                  icon={IndianRupee}
                  tone="cyan"
                />
                <StatCard
                  title="Renewal Rate"
                  value={`${summary.renewalRate}%`}
                  note={`${summary.renewedCount} of ${summary.expiredCount} expired`}
                  icon={RefreshCw}
                  tone="indigo"
                />
              </div>
              {summary.revenueByProgram && summary.revenueByProgram.length > 0 && (
                <div className="page-section mt-4">
                  <h4 className="text-sm text-slate-800">Revenue by Program</h4>
                  <ul className="mt-3 space-y-2 text-sm">
                    {summary.revenueByProgram.map((p) => (
                      <li key={p.programId} className="flex justify-between border-b border-slate-200/80 pb-2 last:border-0">
                        <span className="font-medium text-slate-700">{p.programName}</span>
                        <span className="text-slate-900">₹{p.revenue.toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {summary.programEnrollments.length > 0 && (
            <div className="page-section mt-6">
              <SectionHeader title="Program Enrollments" icon={Users} />
              <ul className="mt-3 space-y-2 text-sm">
                {summary.programEnrollments.map((p) => (
                  <li key={p.programName} className="flex justify-between border-b border-slate-200/80 pb-2 last:border-0">
                    <span className="font-medium text-slate-700">{p.programName}</span>
                    <span className="text-slate-900">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.attendanceEnabled && summary.attendanceTrend.length > 0 && (
            <div className="page-section mt-6">
              <SectionHeader
                title="Attendance"
                icon={ClipboardCheck}
                action={
                  <Link to="/attendance" className="btn-link text-sm">
                    Manage <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <p className="mt-2 text-sm font-medium text-slate-600">
                {summary.inactiveMemberCount} inactive members (no visit in 30 days)
              </p>
              {summary.peakHours.length > 0 && (
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Peak hour: {summary.peakHours[0].hour}:00 ({summary.peakHours[0].count} check-ins)
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {summary.attendanceTrend.slice(-14).map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count}`}
                    className="flex h-20 w-7 flex-col items-center justify-end rounded-lg bg-amber-100/60"
                  >
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-amber-400 to-amber-300"
                      style={{ height: `${Math.min(d.count * 8, 56)}px` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!summary && (
        <p className="mt-6 font-medium text-slate-500">Loading dashboard…</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickLink to="/enquiries" title="Enquiries" desc="Manage leads and follow-ups" icon={MessageSquare} tone="emerald" />
        <QuickLink to="/members" title="Members" desc="View member profiles" icon={Users} tone="blue" />
        {summary?.attendanceEnabled && (
          <QuickLink to="/attendance" title="Attendance" desc="Check-in / check-out" icon={ClipboardCheck} tone="violet" />
        )}
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl text-slate-900">{title}</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
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
        <Icon className="h-5 w-5 text-brand-600" strokeWidth={2.5} />
        <h3 className="text-base text-slate-900">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function ExpiryCard({
  label,
  count,
  bucket,
  urgent,
}: {
  label: string;
  count: number;
  bucket: string;
  urgent?: boolean;
}) {
  return (
    <Link
      to={`/members/expiring?bucket=${bucket}`}
      className={`group rounded-2xl border-2 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        urgent && count > 0
          ? 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-sm shadow-orange-100/60'
          : 'border-stone-200/80 bg-gradient-to-br from-stone-50 to-amber-50/30 shadow-sm hover:border-amber-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <CalendarClock className={`h-4 w-4 ${urgent && count > 0 ? 'text-orange-500' : 'text-stone-400'}`} />
      </div>
      <p className={`mt-2 text-3xl font-extrabold ${urgent && count > 0 ? 'text-orange-800' : 'text-stone-800'}`}>
        {count}
      </p>
    </Link>
  );
}

function QuickLink({
  to,
  title,
  desc,
  icon: Icon,
  tone,
}: {
  to: string;
  title: string;
  desc: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: 'blue' | 'emerald' | 'violet';
}) {
  const iconBg = {
    blue: 'bg-sky-100 text-sky-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700',
  }[tone];

  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-2xl border-2 border-stone-200/80 bg-gradient-to-br from-white to-amber-50/40 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
    >
      <div className={`rounded-xl p-2.5 ${iconBg}`}>
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div>
        <p className="font-semibold text-slate-900 group-hover:text-brand-700">{title}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}
