import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Plus, Search, TrendingUp, UserCheck, UserX } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import DataTable, { type DataTableColumn } from '../../components/DataTable/DataTable';
import EnquiryRowActions from '../../components/enquiries/EnquiryRowActions';
import { api } from '../../lib/api';
import { monthToDateRange } from '../../lib/date-range';
import StatusBadge, { enquiryStatusVariant } from '../../components/ui/StatusBadge';
import {
  LEAD_SOURCE_LABELS,
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
  limit: number;
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
          <Link
            to={`/enquiries/${row.original.id}`}
            className="text-sm font-medium text-ink hover:text-brand-600"
          >
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
        cell: ({ row }) => (
          <span className="text-ink-muted">{row.original.mobileNumber}</span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        meta: { fixed: true, label: 'Status' },
        enableSorting: true,
        cell: ({ row }) => (
          <StatusBadge variant={enquiryStatusVariant(row.original.status)}>
            {STATUS_LABELS[row.original.status]}
          </StatusBadge>
        ),
      },
      {
        id: 'enquiryNumber',
        accessorKey: 'enquiryNumber',
        header: 'Enquiry ID',
        meta: { label: 'Enquiry ID' },
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-ink-muted">{row.original.enquiryNumber}</span>
        ),
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
        header: 'Enquiry Date',
        meta: { label: 'Enquiry Date' },
        enableSorting: true,
        cell: ({ row }) => new Date(row.original.dateOfEnquiry).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: '',
        meta: { fixed: true, label: 'Actions' },
        cell: ({ row }) => <EnquiryRowActions enquiry={row.original} />,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Enquiries</h2>
          <p className="mt-1 text-sm text-ink-muted">Manage, follow up and convert your leads</p>
        </div>
        <Link to="/enquiries/new" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          New Enquiry
        </Link>
      </div>

      {/* Summary cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="New Enquiries" value={stats.newEnquiries} icon={MessageSquare} accent="info" />
          <SummaryCard label="Converted" value={stats.converted} icon={UserCheck} accent="success" />
          <SummaryCard label="Lost" value={stats.lost} icon={UserX} accent="danger" />
          <SummaryCard label="Open" value={stats.openRemaining} icon={TrendingUp} accent="neutral" />
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <div>
            <label htmlFor="enq-from" className="form-label">From</label>
            <input
              id="enq-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="enq-to" className="form-label">To</label>
            <input
              id="enq-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="enq-search" className="form-label">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                id="enq-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, mobile or email"
                className="input-field pl-9"
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
          </div>
          <div>
            <label htmlFor="enq-status" className="form-label">Status</label>
            <select
              id="enq-status"
              value={status}
              onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
              className="select-field w-full"
            >
              <option value="">All statuses</option>
              {(Object.keys(STATUS_LABELS) as EnquiryStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="enq-source" className="form-label">Source</label>
            <select
              id="enq-source"
              value={leadSource}
              onChange={(e) => updateParams({ leadSource: e.target.value, page: '1' })}
              className="select-field w-full"
            >
              <option value="">All sources</option>
              {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
                <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={applyFilters} className="btn btn-primary">
            <Search className="h-4 w-4" />
            Apply
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        tableKey="enquiries"
        columns={columns}
        data={data?.items ?? []}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(col, order) => updateParams({ sortBy: col, sortOrder: order, page: '1' })}
        page={data?.page}
        pages={data?.pages}
        total={data?.total}
        pageSize={data?.limit ?? 20}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyMessage={data ? 'No enquiries found' : 'Loading…'}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof MessageSquare;
  accent: 'info' | 'success' | 'danger' | 'neutral';
}) {
  const iconClass = {
    info: 'icon-accent-info',
    success: 'icon-accent-success',
    danger: 'icon-accent-danger',
    neutral: 'icon-accent-neutral',
  }[accent];

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <p className="text-2xl font-semibold tabular-nums text-ink">{value}</p>
      </div>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
    </div>
  );
}
