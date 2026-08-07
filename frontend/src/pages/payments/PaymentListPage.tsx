import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DataTable, { type DataTableColumn } from '../../components/DataTable/DataTable';
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
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const status = params.get('status') || '';
  const outstanding = params.get('outstanding') === 'true';
  const page = Number(params.get('page') || '1');
  const sortBy = params.get('sortBy') || 'commitmentDate';
  const sortOrder = (params.get('sortOrder') || 'desc') as 'asc' | 'desc';

  useEffect(() => {
    const qs = new URLSearchParams(params);
    qs.set('limit', '20');
    if (!qs.has('page')) qs.set('page', '1');
    api<ListResponse>(`/payments?${qs}`).then(setData);
    api<PaymentStats>('/payments/stats').then(setStats);
  }, [params]);

  const updateParams = (updates: Record<string, string>) => {
    const qs = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) qs.set(k, v);
      else qs.delete(k);
    });
    setParams(qs);
  };

  const applySearch = () => {
    const qs = new URLSearchParams(params);
    if (search.trim()) qs.set('search', search.trim());
    else qs.delete('search');
    qs.set('page', '1');
    setParams(qs);
  };

  const columns = useMemo<DataTableColumn<PaymentCommitmentSummary>[]>(
    () => [
      {
        id: 'member',
        header: 'Member',
        meta: { fixed: true, label: 'Member' },
        cell: ({ row }) => (
          <div>
            <Link to={`/payments/${row.original.id}`} className="font-medium text-brand-600 hover:underline">
              {row.original.member.fullName}
            </Link>
            <p className="text-xs text-slate-400">{row.original.member.memberNumber}</p>
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        meta: { fixed: true, label: 'Status' },
        enableSorting: true,
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_COLORS[row.original.status]}`}>
            {PAYMENT_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      {
        id: 'program',
        header: 'Program',
        meta: { label: 'Program' },
        cell: ({ row }) => row.original.membership.program.name,
      },
      {
        id: 'finalAmount',
        accessorKey: 'finalAmount',
        header: 'Final ₹',
        meta: { label: 'Final ₹' },
        enableSorting: true,
        cell: ({ row }) => formatCurrency(row.original.finalAmount),
      },
      {
        id: 'amountPaid',
        accessorKey: 'amountPaid',
        header: 'Paid ₹',
        meta: { label: 'Paid ₹' },
        enableSorting: true,
        cell: ({ row }) => formatCurrency(row.original.amountPaid),
      },
      {
        id: 'pendingAmount',
        accessorKey: 'pendingAmount',
        header: 'Pending ₹',
        meta: { label: 'Pending ₹' },
        enableSorting: true,
        cell: ({ row }) => formatCurrency(row.original.pendingAmount),
      },
      {
        id: 'commitmentDate',
        accessorKey: 'commitmentDate',
        header: 'Commitment date',
        meta: { label: 'Commitment date' },
        enableSorting: true,
        cell: ({ row }) =>
          row.original.commitmentDate
            ? new Date(row.original.commitmentDate).toLocaleDateString()
            : '—',
      },
    ],
    [],
  );

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
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
            <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={outstanding}
            onChange={(e) => updateParams({ outstanding: e.target.checked ? 'true' : '', page: '1' })}
          />
          Outstanding only
        </label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member…"
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && applySearch()}
        />
        <button type="button" onClick={applySearch} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
          Search
        </button>
      </div>

      <div className="mt-4">
        <DataTable
          tableKey="payments"
          columns={columns}
          data={data?.items ?? []}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(col, order) => updateParams({ sortBy: col, sortOrder: order, page: '1' })}
          page={data?.page}
          pages={data?.pages}
          onPageChange={(p) => updateParams({ page: String(p) })}
          emptyMessage={data ? 'No payment records' : 'Loading…'}
        />
      </div>
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
