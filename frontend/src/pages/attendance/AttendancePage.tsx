import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { AttendanceListResponse, AttendanceRecord } from '../../types/attendance';
import type { Member } from '../../types/member';

export default function AttendancePage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [members, setMembers] = useState<Member[]>([]);
  const [checkInMemberId, setCheckInMemberId] = useState('');
  const [batch, setBatch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRecords = () => {
    api<AttendanceListResponse>(`/attendance?date=${date}&limit=50`)
      .then((res) => setRecords(res.items))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    api<{ enabled: boolean }>('/attendance/enabled')
      .then((r) => setEnabled(r.enabled))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    if (enabled) {
      loadRecords();
      api<{ items: Member[] }>('/members?limit=200')
        .then((r) => setMembers(r.items))
        .catch(() => {});
    }
  }, [enabled, date]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ memberId: checkInMemberId, batch: batch || undefined }),
      });
      setMessage('Check-in recorded');
      setCheckInMemberId('');
      setBatch('');
      loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    }
  };

  const handleCheckOut = async (id: string) => {
    setError('');
    setMessage('');
    try {
      await api(`/attendance/${id}/check-out`, { method: 'PATCH' });
      setMessage('Check-out recorded');
      loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-out failed');
    }
  };

  if (enabled === null) return <p className="text-ink-secondary">Loading…</p>;

  if (!enabled) {
    return (
      <div className="max-w-lg rounded-xl border border-warning-border bg-warning-soft p-6">
        <h2 className="text-xl text-ink">Attendance Disabled</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          Enable attendance tracking in{' '}
          <Link to="/config/gym" className="font-medium underline">
            Gym Info
          </Link>{' '}
          to use this module.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl text-ink">Attendance</h2>
      <p className="mt-1 text-ink-secondary">Record check-ins and check-outs for today</p>

      <form onSubmit={handleCheckIn} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
        <label className="text-sm">
          <span className="text-ink-secondary">Member</span>
          <select
            required
            className="mt-1 block min-w-[200px] rounded-lg border border-line-strong px-3 py-2"
            value={checkInMemberId}
            onChange={(e) => setCheckInMemberId(e.target.value)}
          >
            <option value="">Select member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.memberNumber})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-ink-secondary">Batch (optional)</span>
          <input
            className="mt-1 block rounded-lg border border-line-strong px-3 py-2"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="Morning / Evening"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Check In
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-success">{message}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <label className="text-sm text-ink-secondary">
          Date
          <input
            type="date"
            className="ml-2 rounded-lg border border-line-strong px-3 py-1.5"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-canvas text-left text-ink-secondary">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Check-in</th>
              <th className="px-4 py-3">Check-out</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link to={`/members/${r.member.id}`} className="text-brand-600 hover:underline">
                    {r.member.fullName}
                  </Link>
                  <p className="text-xs text-ink-muted">{r.member.memberNumber}</p>
                </td>
                <td className="px-4 py-3">{new Date(r.checkIn).toLocaleTimeString()}</td>
                <td className="px-4 py-3">
                  {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}
                </td>
                <td className="px-4 py-3">
                  {r.sessionMinutes != null ? `${r.sessionMinutes} min` : '—'}
                </td>
                <td className="px-4 py-3">{r.batch || '—'}</td>
                <td className="px-4 py-3">
                  {!r.checkOut && (
                    <button
                      type="button"
                      onClick={() => handleCheckOut(r.id)}
                      className="text-brand-600 hover:underline"
                    >
                      Check out
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  No attendance for this date
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
