import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Exercise } from '../../types/training-card';

type ExerciseDetailModalProps = {
  exercise: Exercise | null;
  onClose: () => void;
  footer?: ReactNode;
};

export default function ExerciseDetailModal({ exercise, onClose, footer }: ExerciseDetailModalProps) {
  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-white shadow-lg">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h3 className="text-xl font-semibold text-ink">{exercise.name}</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              {[exercise.bodyPart, exercise.primaryMuscle].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-ink-muted hover:bg-canvas hover:text-ink"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {exercise.imageUrl ? (
            <img
              src={exercise.imageUrl}
              alt={exercise.name}
              className="mx-auto mb-5 max-h-64 w-full max-w-sm rounded-lg border border-line object-contain bg-canvas"
            />
          ) : (
            <div className="mb-5 flex h-48 items-center justify-center rounded-lg border border-line bg-canvas text-sm text-ink-muted">
              No illustration available
            </div>
          )}

          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Type" value={exercise.type} />
            <DetailItem label="Body part" value={exercise.bodyPart} />
            <DetailItem label="Primary muscle" value={exercise.primaryMuscle} />
            <DetailItem label="Secondary muscles" value={exercise.secondaryMuscles} />
            <DetailItem label="Equipment" value={exercise.equipment} />
            <DetailItem label="Muscle groups" value={exercise.muscleGroups} />
          </dl>

          {exercise.technique && (
            <section className="mt-5">
              <h4 className="text-sm font-semibold text-ink">Technique</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-secondary">{exercise.technique}</p>
            </section>
          )}

          {exercise.safetyNotes && (
            <section className="mt-4">
              <h4 className="text-sm font-semibold text-ink">Safety notes</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-secondary">{exercise.safetyNotes}</p>
            </section>
          )}
        </div>

        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}
