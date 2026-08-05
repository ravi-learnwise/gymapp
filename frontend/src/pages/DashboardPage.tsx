import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { PERIOD_LABELS, type DashboardSummary, type ReportPeriod } from '../types/dashboard';

const PERIODS: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    if (user?.role === 'OWNER' || user?.role === 'MANAGER') {
      api<DashboardSummary>(`/dashboard/summary?period=${period}`)
        .then(setSummary)
        .catch(() => setSummary(null));
    }
  }, [user, period]);

  if (user?.role === 'TRAINER') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Trainer Portal</h2>
        <p className="mt-1 text-slate-500">Welcome back, {user?.firstName || user?.email}</p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">View members assigned to you and their fitness assessments.</p>
          <Link to="/members" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
            My Members →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-slate-500">Welcome back, {user?.firstName || user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
          <Link
            to="/reports"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Reports →
          </Link>
        </div>
      </div>

      {summary && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Active Members" value={summary.activeMembers} />
            <Card title="New Enquiries" value={summary.newEnquiries} />
            <Card title="Conversion Rate" value={`${summary.conversionRate}%`} />
            <Card title="Pending Payments" value={summary.pendingPayments} />
          </div>

          {user?.role === 'OWNER' && summary.revenue != null && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-800">Revenue</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Card
                  title={`Revenue (${PERIOD_LABELS[period]})`}
                  value={`₹${summary.revenue.toLocaleString('en-IN')}`}
                  note={`${summary.transactionCount ?? 0} transactions`}
                />
                <Card title="Renewal Rate" value={`${summary.renewalRate}%`} note={`${summary.renewedCount} of ${summary.expiredCount} expired`} />
              </div>
              {summary.revenueByProgram && summary.revenueByProgram.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
                  <h4 className="text-sm font-medium text-slate-700">Revenue by Program</h4>
                  <ul className="mt-3 space-y-2 text-sm">
                    {summary.revenueByProgram.map((p) => (
                      <li key={p.programId} className="flex justify-between">
                        <span>{p.programName}</span>
                        <span className="font-medium">₹{p.revenue.toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {summary.programEnrollments.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-800">Program Enrollments</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {summary.programEnrollments.map((p) => (
                  <li key={p.programName} className="flex justify-between">
                    <span>{p.programName}</span>
                    <span className="font-medium">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.attendanceEnabled && summary.attendanceTrend.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Attendance</h3>
                <Link to="/attendance" className="text-sm text-brand-600 hover:underline">
                  Manage →
                </Link>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {summary.inactiveMemberCount} inactive members (no visit in 30 days)
              </p>
              {summary.peakHours.length > 0 && (
                <p className="mt-1 text-sm text-slate-600">
                  Peak hour: {summary.peakHours[0].hour}:00 ({summary.peakHours[0].count} check-ins)
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {summary.attendanceTrend.slice(-14).map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count}`}
                    className="flex h-16 w-6 flex-col items-center justify-end rounded bg-brand-100"
                  >
                    <div
                      className="w-full rounded bg-brand-600"
                      style={{ height: `${Math.min(d.count * 8, 48)}px` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!summary && (
        <p className="mt-6 text-slate-500">Loading dashboard…</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <QuickLink to="/enquiries" title="Enquiries" desc="Manage leads and follow-ups" />
        <QuickLink to="/members" title="Members" desc="View member profiles" />
        {summary?.attendanceEnabled && (
          <QuickLink to="/attendance" title="Attendance" desc="Check-in / check-out" />
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  note,
}: {
  title: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </div>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300">
      <p className="font-medium text-brand-700">{title} →</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </Link>
  );
}
