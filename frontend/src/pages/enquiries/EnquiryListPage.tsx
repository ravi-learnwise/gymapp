import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DataTable, { type DataTableColumn } from '../../components/DataTable/DataTable';
import { api } from '../../lib/api';
import { monthToDateRange } from '../../lib/date-range';
import {
  LEAD_SOURCE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  type Enquiry,
  type EnquiryStats,
  type EnquiryStatus,
  type LeadSource,
} from '../../types/enquiry';

type ListResponse = {
  items: Enquiry[];
  total: number;
  page: number;
  pages: number;
};

export default function EnquiryListPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [stats, setStats] = useState<EnquiryStats | null>(null);
  const mtd = monthToDateRange();
  const [dateFrom, setDateFrom] = useState(params.get('dateFrom') || mtd.dateFrom);
  const [dateTo, setDateTo] = useState(params.get('dateTo') || mtd.dateTo);
  const [search, setSearch] = useState(params.get('search') || '');
  const status = params.get('status') || '';
  const leadSource = params.get('leadSource') || '';
  const page = Number(params.get('page') || '1');
  const sortBy = params.get('sortBy') || 'dateOfEnquiry';
  const sortOrder = (params.get('sortOrder') || 'desc') as 'asc' | 'desc';

  const load = () => {
    const qs = new URLSearchParams(params);
    api<ListResponse>(`/enquiries?${qs}`).then(setData);
    api<EnquiryStats>(`/enquiries/stats?dateFrom=${dateFrom}&dateTo=${dateTo}`).then(setStats);
  };

  useEffect(() => { load(); }, [params, dateFrom, dateTo]);

  const applyFilters = () => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    if (leadSource) qs.set('leadSource', leadSource);
    if (dateFrom) qs.set('dateFrom', dateFrom);
    if (dateTo) qs.set('dateTo', dateTo);
    qs.set('page', '1');
    qs.set('sortBy', sortBy);
    qs.set('sortOrder', sortOrder);
    setParams(qs);
  };

  const updateParams = (updates: Record<string, string>) => {
    const qs = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) qs.set(k, v);
      else qs.delete(k);
    });
    setParams(qs);
  };

  const columns = useMemo<DataTableColumn<Enquiry>[]>(
    () => [
      {
        id: 'fullName',
        accessorKey: 'fullName',
        header: 'Name',
        meta: { fixed: true, label: 'Name' },
        enableSorting: true,
        cell: ({ row }) => (
          <Link to={`/enquiries/${row.original.id}`} className="font-medium text-brand-600 hover:underline">
            {row.original.fullName}
          </Link>
        ),
      },
      {
        id: 'mobileNumber',
        accessorKey: 'mobileNumber',
        header: 'Mobile',
        meta: { fixed: true, label: 'Mobile' },
        enableSorting: true,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        meta: { fixed: true, label: 'Status' },
        enableSorting: true,
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.original.status]}`}>
            {STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      {
        id: 'enquiryNumber',
        accessorKey: 'enquiryNumber',
        header: 'Enquiry ID',
        meta: { label: 'Enquiry ID' },
        enableSorting: true,
      },
      {
        id: 'leadSource',
        accessorKey: 'leadSource',
        header: 'Source',
        meta: { label: 'Source' },
        enableSorting: true,
        cell: ({ row }) => LEAD_SOURCE_LABELS[row.original.leadSource],
      },
      {
        id: 'offeredProgram',
        header: 'Program',
        meta: { label: 'Program' },
        cell: ({ row }) => row.original.offeredProgram?.name ?? '—',
      },
      {
        id: 'offeredProgramDuration',
        header: 'Duration',
        meta: { label: 'Duration' },
        cell: ({ row }) => row.original.offeredProgramDuration?.label ?? '—',
      },
      {
        id: 'dateOfEnquiry',
        accessorKey: 'dateOfEnquiry',
        header: 'Date',
        meta: { label: 'Date' },
        enableSorting: true,
        cell: ({ row }) => new Date(row.original.dateOfEnquiry).toLocaleDateString(),
      },
    ],
    [],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Enquiries</h2>
          <p className="text-sm text-slate-500">CRM — capture and convert leads</p>
        </div>
        <Link
          to="/enquiries/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Enquiry
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="text-slate-600">From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="ml-1 rounded-lg border px-2 py-1.5" />
        </label>
        <label className="text-sm">
          <span className="text-slate-600">To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="ml-1 rounded-lg border px-2 py-1.5" />
        </label>
        <button type="button" onClick={applyFilters} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
          Apply dates
        </button>
      </div>

      {stats && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <StatCard label="New Enquiries" value={stats.newEnquiries} />
          <StatCard label="Converted" value={stats.converted} />
          <StatCard label="Lost" value={stats.lost} />
          <StatCard label="Open (in period)" value={stats.openRemaining} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, mobile, email, ID…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
        />
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as EnquiryStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={leadSource}
          onChange={(e) => updateParams({ leadSource: e.target.value, page: '1' })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All sources</option>
          {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
            <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
          ))}
        </select>
        <button onClick={applyFilters} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Search
        </button>
      </div>

      <div className="mt-4">
        <DataTable
          tableKey="enquiries"
          columns={columns}
          data={data?.items ?? []}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(col, order) => updateParams({ sortBy: col, sortOrder: order, page: '1' })}
          page={data?.page}
          pages={data?.pages}
          onPageChange={(p) => updateParams({ page: String(p) })}
          emptyMessage={data ? 'No enquiries found' : 'Loading…'}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
