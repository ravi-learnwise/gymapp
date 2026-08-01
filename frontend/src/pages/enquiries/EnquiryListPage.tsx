import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
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
  const [search, setSearch] = useState(params.get('search') || '');
  const status = params.get('status') || '';
  const leadSource = params.get('leadSource') || '';

  const load = () => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    if (leadSource) qs.set('leadSource', leadSource);
    api<ListResponse>(`/enquiries?${qs}`).then(setData);
    api<EnquiryStats>('/enquiries/stats').then(setStats);
  };

  useEffect(() => { load(); }, [params]);

  const applyFilters = () => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    if (leadSource) qs.set('leadSource', leadSource);
    setParams(qs);
  };

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

      {stats && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Open" value={stats.open} />
          <StatCard label="Converted" value={stats.converted} />
          <StatCard label="Conversion %" value={`${stats.conversionRate}%`} />
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
          onChange={(e) => {
            const qs = new URLSearchParams(params);
            e.target.value ? qs.set('status', e.target.value) : qs.delete('status');
            setParams(qs);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as EnquiryStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={leadSource}
          onChange={(e) => {
            const qs = new URLSearchParams(params);
            e.target.value ? qs.set('leadSource', e.target.value) : qs.delete('leadSource');
            setParams(qs);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All sources</option>
          {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
            <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
          ))}
        </select>
        <button
          onClick={applyFilters}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Search
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/enquiries/${e.id}`} className="font-medium text-brand-600 hover:underline">
                    {e.enquiryNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{e.fullName}</td>
                <td className="px-4 py-3">{e.mobileNumber}</td>
                <td className="px-4 py-3">{LEAD_SOURCE_LABELS[e.leadSource]}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                    {STATUS_LABELS[e.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(e.dateOfEnquiry).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No enquiries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
