import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ENROLLMENT_TYPE_LABELS, type ProgramEnrollmentType } from '../../types/training-card';
import { trainerName } from '../../types/member';

type Duration = { id: string; label: string; months: number; price: string };
type Program = {
  id: string;
  name: string;
  enrollmentType: ProgramEnrollmentType;
  durations: Duration[];
};
type Trainer = { id: string; firstName: string | null; lastName: string | null; email: string };

type AddResult = {
  membership: { id: string; program: { name: string } };
  warnings: string[];
};

export default function AddMembershipPage() {
  const { id: memberId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [programId, setProgramId] = useState('');
  const [durationId, setDurationId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [isTrial, setIsTrial] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Program[]>('/programs').then(setPrograms);
    api<Trainer[]>('/enrollments/trainers').then(setTrainers);
    if (user?.role === 'TRAINER') setTrainerId(user.id);
  }, [user]);

  const selectedProgram = programs.find((p) => p.id === programId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!memberId || !programId || !durationId) return;
    setLoading(true);
    setError('');
    setWarnings([]);
    try {
      const result = await api<AddResult>(`/members/${memberId}/memberships`, {
        method: 'POST',
        body: JSON.stringify({
          programId,
          programDurationId: durationId,
          trainerId: trainerId || undefined,
          startDate,
          isTrial,
        }),
      });
      if (result.warnings?.length) {
        setWarnings(result.warnings);
        setTimeout(() => navigate(`/members/${memberId}`), 2500);
      } else {
        navigate(`/members/${memberId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add program');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <Link to={`/members/${memberId}`} className="text-sm text-brand-600 hover:underline">
        ← Back to member
      </Link>
      <h2 className="mt-3 text-2xl">Add Program</h2>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
          <p className="mt-2 text-ink-muted">Redirecting…</p>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-line bg-white p-5">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <label className="block text-sm">
          <span className="text-ink-secondary">Program</span>
          <select
            className="input mt-1 w-full"
            value={programId}
            onChange={(e) => {
              setProgramId(e.target.value);
              setDurationId('');
            }}
            required
          >
            <option value="">Select program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({ENROLLMENT_TYPE_LABELS[p.enrollmentType]})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-secondary">Duration</span>
          <select
            className="input mt-1 w-full"
            value={durationId}
            onChange={(e) => setDurationId(e.target.value)}
            required
            disabled={!selectedProgram}
          >
            <option value="">Select duration</option>
            {selectedProgram?.durations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} — ₹{d.price}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-secondary">Trainer</span>
          <select
            className="input mt-1 w-full"
            value={trainerId}
            onChange={(e) => setTrainerId(e.target.value)}
            disabled={user?.role === 'TRAINER'}
          >
            <option value="">Unassigned</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {trainerName(t)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-secondary">Start date</span>
          <input
            type="date"
            className="input mt-1 w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} />
          Trial membership
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding…' : 'Add program'}
        </button>
      </form>
    </div>
  );
}
