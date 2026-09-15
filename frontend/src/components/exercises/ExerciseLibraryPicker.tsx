import { useEffect, useMemo, useState } from 'react';
import { Eye, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import type { Exercise } from '../../types/training-card';
import ExerciseDetailModal from './ExerciseDetailModal';
import ExerciseSearchFilter from './ExerciseSearchFilter';
import Button from '../ui/Button';

type ExerciseLibraryPickerProps = {
  onAdd: (exercise: Exercise) => void;
  title?: string;
};

export default function ExerciseLibraryPicker({ onAdd, title = 'Exercise library' }: ExerciseLibraryPickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [detail, setDetail] = useState<Exercise | null>(null);

  const load = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (bodyPart) params.set('bodyPart', bodyPart);
    const qs = params.toString();
    api<Exercise[]>(`/exercises${qs ? `?${qs}` : ''}`).then(setExercises);
  };

  useEffect(() => {
    const timer = setTimeout(load, search.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, bodyPart]);

  const visible = useMemo(() => exercises.slice(0, 24), [exercises]);

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-secondary">Browse and add exercises to this day&apos;s plan.</p>

      <ExerciseSearchFilter
        className="mt-4"
        search={search}
        bodyPart={bodyPart}
        onSearchChange={setSearch}
        onBodyPartChange={setBodyPart}
        onSelectSuggestion={(ex) => setDetail(ex)}
      />

      <div className="mt-4 grid max-h-[28rem] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
        {visible.map((ex) => (
          <div
            key={ex.id}
            className="flex gap-3 rounded-lg border border-line p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
          >
            {ex.imageUrl ? (
              <img src={ex.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg border object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-canvas text-xs text-ink-muted">
                —
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{ex.name}</p>
              <p className="truncate text-xs text-ink-secondary">
                {[ex.bodyPart, ex.primaryMuscle].filter(Boolean).join(' · ') || ex.type}
              </p>
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-600 hover:bg-brand-50"
                  onClick={() => setDetail(ex)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Details
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-600 hover:bg-brand-50"
                  onClick={() => onAdd(ex)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
        {!visible.length && (
          <p className="col-span-full py-8 text-center text-sm text-ink-muted">No exercises found</p>
        )}
      </div>

      <ExerciseDetailModal
        exercise={detail}
        onClose={() => setDetail(null)}
        footer={
          detail ? (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  onAdd(detail);
                  setDetail(null);
                }}
              >
                Add to plan
              </Button>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
