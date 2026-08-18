import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import type { TrainingCard } from '../../types/training-card';
import StatusBadge from '../../components/ui/StatusBadge';

export default function MemberTrainingCardPage() {
  const { id: memberId } = useParams<{ id: string }>();
  const [cards, setCards] = useState<TrainingCard[]>([]);
  const [active, setActive] = useState<TrainingCard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!memberId) return;
    api<TrainingCard[]>(`/training-cards/member/${memberId}`).then(setCards);
    api<TrainingCard>(`/training-cards/member/${memberId}/active`)
      .then(setActive)
      .catch(() => setActive(null));
  }, [memberId]);

  return (
    <div className="max-w-4xl">
      <Link to={`/members/${memberId}`} className="text-sm text-brand-600 hover:underline">
        ← Back to member
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">Training Card</h2>
        <Link to={`/members/${memberId}/training-card/new`} className="btn btn-primary">
          New card
        </Link>
      </div>

      {active ? (
        <div className="mt-6 rounded-xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{active.name}</h3>
            <StatusBadge variant="success">Active v{active.version}</StatusBadge>
          </div>
          {active.description && <p className="mt-2 text-sm text-ink-secondary">{active.description}</p>}
          {active.reviewDate && (
            <p className="mt-2 text-sm text-ink-secondary">
              Review due: {new Date(active.reviewDate).toLocaleDateString()}
            </p>
          )}
          <Link to={`/training-cards/${active.id}/edit`} className="btn btn-secondary mt-4">
            View / edit draft revisions
          </Link>
        </div>
      ) : (
        <p className="mt-6 text-ink-secondary">No active training card yet.</p>
      )}

      <div className="mt-8">
        <h3 className="font-semibold">Version history</h3>
        <ul className="mt-3 space-y-2">
          {cards.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
              <div>
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-ink-secondary">v{c.version} · {c.status}</span>
              </div>
              {c.status === 'DRAFT' && (
                <Link to={`/training-cards/${c.id}/edit`} className="text-brand-600 hover:underline">
                  Edit
                </Link>
              )}
            </li>
          ))}
          {!cards.length && <li className="text-ink-muted">No training cards</li>}
        </ul>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
