import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { trainerName, type Member } from '../../types/member';

type ListResponse = { items: Member[]; total: number; page: number; pages: number };

export default function MemberListPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ListResponse | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search.trim()) params.set('search', search.trim());
    api<ListResponse>(`/members?${params}`).then(setData);
  };

  useEffect(() => { load(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Members</h2>
          <p className="text-sm text-slate-500">
            {user?.role === 'TRAINER' ? 'Members assigned to you' : 'All gym members'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, mobile, member ID…"
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
          Search
        </button>
      </form>

      {!data ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Trainer</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((m) => {
                  const membership = m.memberships?.[0];
                  return (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link to={`/members/${m.id}`} className="font-medium text-brand-600 hover:underline">
                          {m.memberNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{m.fullName}</td>
                      <td className="px-4 py-3">{m.mobileNumber}</td>
                      <td className="px-4 py-3">{membership?.program.name ?? '—'}</td>
                      <td className="px-4 py-3">{trainerName(membership?.trainer)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${membership?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                          {membership?.status ?? '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
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
