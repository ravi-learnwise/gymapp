import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DataTable, { type DataTableColumn } from '../../components/DataTable/DataTable';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { trainerName, type Member } from '../../types/member';

type ListResponse = { items: Member[]; total: number; page: number; pages: number };

export default function MemberListPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const membershipStatus = params.get('membershipStatus') || '';
  const page = Number(params.get('page') || '1');
  const sortBy = params.get('sortBy') || 'createdAt';
  const sortOrder = (params.get('sortOrder') || 'desc') as 'asc' | 'desc';

  useEffect(() => {
    const qs = new URLSearchParams(params);
    qs.set('limit', '20');
    if (!qs.has('page')) qs.set('page', '1');
    api<ListResponse>(`/members?${qs}`).then(setData);
  }, [params]);

  const applySearch = () => {
    const qs = new URLSearchParams(params);
    if (search.trim()) qs.set('search', search.trim());
    else qs.delete('search');
    qs.set('page', '1');
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

  const columns = useMemo<DataTableColumn<Member>[]>(
    () => [
      {
        id: 'fullName',
        accessorKey: 'fullName',
        header: 'Name',
        meta: { fixed: true, label: 'Name' },
        enableSorting: true,
        cell: ({ row }) => (
          <Link to={`/members/${row.original.id}`} className="font-medium text-brand-600 hover:underline">
            {row.original.fullName}
          </Link>
        ),
      },
      {
        id: 'memberNumber',
        accessorKey: 'memberNumber',
        header: 'Member ID',
        meta: { fixed: true, label: 'Member ID' },
        enableSorting: true,
        cell: ({ row }) => (
          <Link to={`/members/${row.original.id}`} className="text-brand-600 hover:underline">
            {row.original.memberNumber}
          </Link>
        ),
      },
      {
        id: 'mobileNumber',
        accessorKey: 'mobileNumber',
        header: 'Mobile',
        meta: { label: 'Mobile' },
        enableSorting: true,
      },
      {
        id: 'program',
        header: 'Program',
        meta: { label: 'Program' },
        cell: ({ row }) => row.original.memberships?.[0]?.program.name ?? '—',
      },
      {
        id: 'trainer',
        header: 'Trainer',
        meta: { label: 'Trainer' },
        cell: ({ row }) => trainerName(row.original.memberships?.[0]?.trainer),
      },
      {
        id: 'status',
        header: 'Status',
        meta: { label: 'Status' },
        cell: ({ row }) => {
          const status = row.original.memberships?.[0]?.status;
          return (
            <span className={`rounded-full px-2 py-0.5 text-xs ${status === 'ACTIVE' ? 'badge badge-success' : 'bg-neutral-soft text-ink-secondary'}`}>
              {status ?? '—'}
            </span>
          );
        },
      },
      {
        id: 'validTill',
        header: 'Valid till',
        meta: { label: 'Valid till' },
        cell: ({ row }) => {
          const end = row.original.memberships?.[0]?.endDate;
          return end ? new Date(end).toLocaleDateString() : '—';
        },
      },
    ],
    [],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">Members</h2>
          <p className="text-sm text-ink-secondary">
            {user?.role === 'TRAINER' ? 'Members assigned to you' : 'All gym members'}
          </p>
        </div>
        {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
          <Link to="/members/expiring" className="rounded-lg border px-4 py-2 text-sm hover:bg-canvas">
            Expiring memberships →
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, mobile, member ID…"
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && applySearch()}
        />
        <select
          value={membershipStatus}
          onChange={(e) => updateParams({ membershipStatus: e.target.value, page: '1' })}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button type="button" onClick={applySearch} className="rounded-lg border px-4 py-2 text-sm hover:bg-canvas">
          Search
        </button>
      </div>

      <div className="mt-4">
        <DataTable
          tableKey="members"
          columns={columns}
          data={data?.items ?? []}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(col, order) => updateParams({ sortBy: col, sortOrder: order, page: '1' })}
          page={data?.page}
          pages={data?.pages}
          onPageChange={(p) => updateParams({ page: String(p) })}
          emptyMessage={data ? 'No members found' : 'Loading…'}
        />
      </div>
    </div>
  );
}
