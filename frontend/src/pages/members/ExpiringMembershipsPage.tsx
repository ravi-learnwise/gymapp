import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DataTable, { type DataTableColumn } from '../../components/DataTable/DataTable';
import { api } from '../../lib/api';
import type { ExpiringMembershipItem, ExpiringMembershipResponse } from '../../types/member';

type Bucket = '7' | '15' | '30' | 'beyond';

const BUCKETS: { key: Bucket; label: string }[] = [
  { key: '7', label: 'Within 7 days' },
  { key: '15', label: 'Within 15 days' },
  { key: '30', label: 'Within 30 days' },
  { key: 'beyond', label: 'Beyond 30 days' },
];

export default function ExpiringMembershipsPage() {
  const [params, setParams] = useSearchParams();
  const bucket = (params.get('bucket') || '7') as Bucket;
  const page = Number(params.get('page') || '1');
  const [data, setData] = useState<ExpiringMembershipResponse | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ bucket, page: String(page), limit: '20' });
    api<ExpiringMembershipResponse>(`/memberships/expiring?${qs}`).then(setData);
  }, [bucket, page]);

  const setBucket = (b: Bucket) => {
    const qs = new URLSearchParams(params);
    qs.set('bucket', b);
    qs.set('page', '1');
    setParams(qs);
  };

  const columns = useMemo<DataTableColumn<ExpiringMembershipItem>[]>(
    () => [
      {
        id: 'memberName',
        accessorKey: 'memberName',
        header: 'Member',
        meta: { fixed: true, label: 'Member' },
        cell: ({ row }) => (
          <Link to={`/members/${row.original.memberId}`} className="font-medium text-brand-600 hover:underline">
            {row.original.memberName}
          </Link>
        ),
      },
      {
        id: 'memberNumber',
        accessorKey: 'memberNumber',
        header: 'Member ID',
        meta: { fixed: true, label: 'Member ID' },
      },
      {
        id: 'program',
        accessorKey: 'program',
        header: 'Program',
        meta: { label: 'Program' },
      },
      {
        id: 'duration',
        accessorKey: 'duration',
        header: 'Duration',
        meta: { label: 'Duration' },
      },
      {
        id: 'endDate',
        accessorKey: 'endDate',
        header: 'Valid Till',
        meta: { label: 'Valid Till' },
        cell: ({ row }) => new Date(row.original.endDate).toLocaleDateString(),
      },
      {
        id: 'daysRemaining',
        accessorKey: 'daysRemaining',
        header: 'Days Left',
        meta: { fixed: true, label: 'Days Left' },
        cell: ({ row }) => (
          <span className={row.original.daysRemaining <= 7 ? 'font-medium text-amber-700' : ''}>
            {row.original.daysRemaining}
          </span>
        ),
      },
      {
        id: 'trainer',
        accessorKey: 'trainer',
        header: 'Trainer',
        meta: { label: 'Trainer' },
        cell: ({ row }) => row.original.trainer ?? '—',
      },
    ],
    [],
  );

  return (
    <div>
      <Link to="/dashboard" className="text-sm text-brand-600 hover:underline">← Dashboard</Link>
      <h2 className="mt-2 text-2xl font-bold">Expiring Memberships</h2>
      <p className="text-sm text-slate-500">Active memberships approaching renewal date</p>

      {data && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {BUCKETS.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => setBucket(b.key)}
              className={`rounded-lg border px-4 py-3 text-left ${
                bucket === b.key ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <p className="text-xs text-slate-500">{b.label}</p>
              <p className="text-xl font-bold">
                {b.key === '7' && data.summary.within7}
                {b.key === '15' && data.summary.within15}
                {b.key === '30' && data.summary.within30}
                {b.key === 'beyond' && data.summary.beyond30}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <DataTable
          tableKey="expiring-memberships"
          columns={columns}
          data={data?.items ?? []}
          page={data?.page}
          pages={data?.pages}
          onPageChange={(p) => {
            const qs = new URLSearchParams(params);
            qs.set('page', String(p));
            setParams(qs);
          }}
          emptyMessage={data ? 'No memberships in this bucket' : 'Loading…'}
        />
      </div>
    </div>
  );
}
