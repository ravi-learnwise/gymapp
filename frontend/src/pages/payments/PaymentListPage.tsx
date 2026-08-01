import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  formatCurrency,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  type PaymentCommitmentSummary,
  type PaymentStats,
  type PaymentStatus,
} from '../../types/payment';

type ListResponse = {
  items: PaymentCommitmentSummary[];
  total: number;
  page: number;
  pages: number;
};

export default function PaymentListPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [outstanding, setOutstanding] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    if (outstanding) params.set('outstanding', 'true');
    if (search.trim()) params.set('search', search.trim());
    api<ListResponse>(`/payments?${params}`).then(setData);
    api<PaymentStats>('/payments/stats').then(setStats);
  };

  useEffect(() => { load(); }, [page, status, outstanding]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Payments</h2>
      <p className="text-sm text-slate-500">Payment commitments and outstanding balances</p>

      {stats && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Outstanding" value={formatCurrency(stats.outstandingAmount)} highlight />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Partial" value={stats.partial} />
          <StatCard label="Due Reminders" value={stats.dueReminders} highlight={stats.dueReminders > 0} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <select value={status} onChange={(e) => { setStatus(e.target.value as PaymentStatus | ''); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
        <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <input type="checkbox" checked={outstanding} onChange={(e) => { setOutstanding(e.target.checked); setPage(1); }} />
          Outstanding only
        </label>
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search member…" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Search</button>
        </form>
      </div>

      {!data ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Final Amount</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/payments/${p.id}`} className="font-medium text-brand-600 hover:underline">
                        {p.member.fullName}
                      </Link>
                      <p className="text-xs text-slate-400">{p.member.memberNumber}</p>
                    </td>
                    <td className="px-4 py-3">{p.membership.program.name}</td>
                    <td className="px-4 py-3">{formatCurrency(p.finalAmount)}</td>
                    <td className="px-4 py-3">{formatCurrency(p.amountPaid)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.pendingAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_COLORS[p.status]}`}>
                        {PAYMENT_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No payment records</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-40">Prev</button>
              <span className="text-sm text-slate-500">Page {page} of {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
