import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { hasMinRole } from '../../lib/roles';
import type { DietPlan } from '../../types/diet-plan';
import { OBJECTIVE_LABELS } from '../../types/diet-plan';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

export default function MemberDietPlanPage() {
  const { id: memberId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canArchive = hasMinRole(user?.role ?? 'TRAINER', 'MANAGER');
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [active, setActive] = useState<DietPlan | null>(null);
  const [message, setMessage] = useState('');

  const load = () => {
    if (!memberId) return;
    api<DietPlan[]>(`/diet-plans/member/${memberId}`).then(setPlans);
    api<DietPlan>(`/diet-plans/member/${memberId}/active`)
      .then(setActive)
      .catch(() => setActive(null));
  };

  useEffect(() => {
    load();
  }, [memberId]);

  const revise = async () => {
    if (!active) return;
    try {
      const revised = await api<DietPlan>(`/diet-plans/${active.id}/revise`, {
        method: 'POST',
        body: '{}',
      });
      setMessage('New draft version created');
      window.location.href = `/diet-plans/${revised.id}/edit`;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create revision');
    }
  };

  const archive = async (planId: string) => {
    if (!confirm('Archive this diet plan?')) return;
    try {
      await api(`/diet-plans/${planId}/archive`, { method: 'POST', body: '{}' });
      setMessage('Plan archived');
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Archive failed');
    }
  };

  return (
    <div className="max-w-4xl">
      <Link to={`/members/${memberId}`} className="text-sm text-brand-600 hover:underline">
        ← Back to member
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">Diet Plan</h2>
        <Link to={`/members/${memberId}/diet-plan/new`} className="btn btn-primary">
          New plan
        </Link>
      </div>

      {active ? (
        <div className="mt-6 rounded-xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{active.name}</h3>
            <StatusBadge variant="success">Active v{active.version}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-ink-secondary">
            {OBJECTIVE_LABELS[active.objective]}
          </p>
          {active.description && (
            <p className="mt-2 text-sm text-ink-secondary">{active.description}</p>
          )}
          {active.hydrationGoal && (
            <p className="mt-2 text-sm text-ink-secondary">Hydration: {active.hydrationGoal}</p>
          )}
          {active.reviewDate && (
            <p className="mt-2 text-sm text-ink-secondary">
              Review due: {new Date(active.reviewDate).toLocaleDateString()}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={revise}>
              Create revision (new draft)
            </Button>
            {canArchive && (
              <Button variant="ghost" className="!text-danger" onClick={() => archive(active.id)}>
                Archive active plan
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-ink-secondary">No active diet plan yet.</p>
      )}

      <div className="mt-8">
        <h3 className="font-semibold">Version history</h3>
        <ul className="mt-3 space-y-2">
          {plans.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
              <div>
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-ink-secondary">
                  v{p.version} · {p.status} · {OBJECTIVE_LABELS[p.objective]}
                </span>
              </div>
              <div className="flex gap-3">
                {p.status === 'DRAFT' && (
                  <Link to={`/diet-plans/${p.id}/edit`} className="text-brand-600 hover:underline">
                    Edit
                  </Link>
                )}
                {canArchive && p.status !== 'ARCHIVED' && (
                  <button
                    type="button"
                    className="text-danger hover:underline"
                    onClick={() => archive(p.id)}
                  >
                    Archive
                  </button>
                )}
              </div>
            </li>
          ))}
          {!plans.length && <li className="text-ink-muted">No diet plans</li>}
        </ul>
      </div>

      {message && <p className="mt-4 text-sm text-ink-secondary">{message}</p>}
    </div>
  );
}
