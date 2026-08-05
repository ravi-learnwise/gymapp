import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  PERIOD_LABELS,
  REPORT_TYPE_LABELS,
  type ReportPeriod,
  type ReportType,
} from '../../types/dashboard';

const PERIODS: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

const ALL_TYPES: ReportType[] = [
  'financial',
  'enquiries',
  'enrollments',
  'payments',
  'attendance',
  'referrals',
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [type, setType] = useState<ReportType>('enquiries');
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableTypes = ALL_TYPES.filter(
    (t) => t !== 'financial' || user?.role === 'OWNER',
  );

  useEffect(() => {
    setLoading(true);
    setError('');
    api<Record<string, unknown>>(`/dashboard/reports?period=${period}&type=${type}`)
      .then(setReport)
      .catch((err) => {
        setError(err.message);
        setReport(null);
      })
      .finally(() => setLoading(false));
  }, [period, type]);

  const exportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${period}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
          <p className="mt-1 text-slate-500">Operational and financial reports by period</p>
        </div>
        {report && user?.role === 'OWNER' && (
          <button
            type="button"
            onClick={exportJson}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Export JSON
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <label className="text-sm">
          <span className="text-slate-600">Period</span>
          <select
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-slate-600">Report type</span>
          <select
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
          >
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {REPORT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {user?.role === 'MANAGER' && (
        <p className="mt-3 text-sm text-slate-500">
          Financial reports are available to owners only.
        </p>
      )}

      {loading && <p className="mt-6 text-slate-500">Loading report…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {report && !loading && (
        <div className="mt-6 space-y-4">
          <ReportSummary report={report} type={type} />
          <ReportItems report={report} type={type} />
        </div>
      )}
    </div>
  );
}

function ReportSummary({ report, type }: { report: Record<string, unknown>; type: ReportType }) {
  const cards: { label: string; value: string | number }[] = [];

  if (type === 'financial') {
    cards.push(
      { label: 'Total Revenue', value: `₹${Number(report.totalRevenue ?? 0).toLocaleString('en-IN')}` },
      { label: 'Transactions', value: Number(report.transactionCount ?? 0) },
      { label: 'Outstanding', value: `₹${Number(report.outstandingAmount ?? 0).toLocaleString('en-IN')}` },
    );
  } else if (type === 'enquiries') {
    cards.push(
      { label: 'New in Period', value: Number(report.newInPeriod ?? 0) },
      { label: 'Conversion Rate', value: `${report.conversionRate ?? 0}%` },
      { label: 'Total Enquiries', value: Number(report.total ?? 0) },
    );
  } else if (type === 'enrollments') {
    cards.push({ label: 'Enrollments', value: Number(report.total ?? 0) });
  } else if (type === 'referrals') {
    cards.push(
      { label: 'Referrals', value: Number(report.total ?? 0) },
      { label: 'Converted', value: Number(report.converted ?? 0) },
      { label: 'Conversion', value: `${report.conversionRate ?? 0}%` },
    );
  } else if (type === 'attendance') {
    if (report.enabled === false) {
      return (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Attendance module is disabled.
        </p>
      );
    }
    cards.push(
      { label: 'Check-ins', value: Number(report.totalCheckIns ?? 0) },
      { label: 'Unique Members', value: Number(report.uniqueMembers ?? 0) },
      { label: 'Inactive (30d)', value: Number(report.inactiveCount ?? 0) },
    );
  } else if (type === 'payments' && report.summary) {
    const s = report.summary as Record<string, number>;
    cards.push(
      { label: 'Pending', value: s.pending ?? 0 },
      { label: 'Partial', value: s.partial ?? 0 },
      { label: 'Paid', value: s.paid ?? 0 },
    );
  }

  if (!cards.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{c.label}</p>
          <p className="mt-1 text-2xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function ReportItems({ report, type }: { report: Record<string, unknown>; type: ReportType }) {
  const items = (report.items ?? report.transactions) as Record<string, unknown>[] | undefined;
  if (!items?.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            {Object.keys(items[0])
              .filter((k) => !['id'].includes(k))
              .slice(0, 6)
              .map((k) => (
                <th key={k} className="px-4 py-3 capitalize">
                  {k.replace(/([A-Z])/g, ' $1')}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 50).map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              {Object.entries(row)
                .filter(([k]) => !['id'].includes(k))
                .slice(0, 6)
                .map(([k, v]) => (
                  <td key={k} className="px-4 py-3">
                    {formatCell(v)}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
      {items.length > 50 && (
        <p className="px-4 py-2 text-xs text-slate-400">Showing first 50 of {items.length}</p>
      )}
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string' && v.includes('T') && !isNaN(Date.parse(v))) {
    return new Date(v).toLocaleString();
  }
  return String(v);
}
