import { useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import ExerciseLibraryPicker from '../exercises/ExerciseLibraryPicker';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  DAY_TYPE_LABELS,
  WEEKDAY_LABELS,
  type Exercise,
  type TrainingDayType,
} from '../../types/training-card';
import type { TrainingDayDraft } from './training-week';

const ACTIVITY_TYPES: TrainingDayType[] = ['NOT_ASSIGNED', 'WORKOUT', 'REST', 'RECOVERY'];

type TrainingWeekBuilderProps = {
  days: TrainingDayDraft[];
  onDaysChange: Dispatch<SetStateAction<TrainingDayDraft[]>>;
  activeTab: number;
  onActiveTabChange: (weekday: number) => void;
};

export default function TrainingWeekBuilder({
  days,
  onDaysChange,
  activeTab,
  onActiveTabChange,
}: TrainingWeekBuilderProps) {
  const [removeTarget, setRemoveTarget] = useState<{ index: number; name: string } | null>(null);
  const currentDay = days[activeTab];

  const setDays = onDaysChange;

  const addExercise = (ex: Exercise) => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? {
              ...d,
              dayType: d.dayType === 'NOT_ASSIGNED' ? 'WORKOUT' : d.dayType,
              exercises: [
                ...d.exercises,
                {
                  exerciseId: ex.id,
                  exerciseName: ex.name,
                  imageUrl: ex.imageUrl ?? undefined,
                  sets: [{ setNumber: 1, reps: 10, weightUnit: 'KG' as const }],
                },
              ],
            }
          : d,
      ),
    );
  };

  const removeExercise = (index: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? { ...d, exercises: d.exercises.filter((_, i) => i !== index) }
          : d,
      ),
    );
    setRemoveTarget(null);
  };

  const moveExercise = (index: number, dir: -1 | 1) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== activeTab) return d;
        const next = [...d.exercises];
        const target = index + dir;
        if (target < 0 || target >= next.length) return d;
        [next[index], next[target]] = [next[target], next[index]];
        return { ...d, exercises: next };
      }),
    );
  };

  const updateSet = (
    exIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: number | undefined,
  ) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== activeTab) return d;
        const exercises = d.exercises.map((ex, ei) => {
          if (ei !== exIndex) return ex;
          const sets = ex.sets.map((s, si) =>
            si === setIndex ? { ...s, [field]: value } : s,
          );
          return { ...ex, sets };
        });
        return { ...d, exercises };
      }),
    );
  };

  const addSet = (exIndex: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== activeTab) return d;
        const exercises = d.exercises.map((ex, ei) => {
          if (ei !== exIndex) return ex;
          const last = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                setNumber: ex.sets.length + 1,
                reps: last?.reps ?? 10,
                weight: last?.weight,
                weightUnit: last?.weightUnit ?? 'KG',
              },
            ],
          };
        });
        return { ...d, exercises };
      }),
    );
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== activeTab) return d;
        const exercises = d.exercises.map((ex, ei) => {
          if (ei !== exIndex) return ex;
          const sets = ex.sets
            .filter((_, si) => si !== setIndex)
            .map((s, i) => ({ ...s, setNumber: i + 1 }));
          return { ...ex, sets };
        });
        return { ...d, exercises };
      }),
    );
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === i ? 'bg-brand-600 text-white' : 'bg-neutral-soft text-ink-secondary hover:bg-brand-50'
            }`}
            onClick={() => onActiveTabChange(i)}
          >
            {label}
            {days[i].exercises.length > 0 && (
              <span className="ml-1.5 opacity-75">({days[i].exercises.length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-6 xl:grid-cols-2">
        <section className="page-panel">
          <div>
            <span className="form-label">Activity type</span>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    currentDay.dayType === type
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-line bg-white text-ink-secondary hover:border-brand-200'
                  }`}
                  onClick={() =>
                    setDays((prev) =>
                      prev.map((d) =>
                        d.weekday === activeTab ? { ...d, dayType: type } : d,
                      ),
                    )
                  }
                >
                  {DAY_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-ink">Workout detail — {WEEKDAY_LABELS[activeTab]}</h4>
            {currentDay.exercises.map((ex, exIndex) => (
              <div key={`${ex.exerciseId}-${exIndex}`} className="rounded-lg border border-line p-4">
                <div className="flex items-start gap-3">
                  {ex.imageUrl ? (
                    <img src={ex.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg border object-cover" />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-lg border bg-canvas" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink">{ex.exerciseName}</p>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="rounded p-1 text-ink-muted hover:bg-canvas hover:text-ink"
                          onClick={() => moveExercise(exIndex, -1)}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-ink-muted hover:bg-canvas hover:text-ink"
                          onClick={() => moveExercise(exIndex, 1)}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-danger hover:bg-danger-soft"
                          onClick={() => setRemoveTarget({ index: exIndex, name: ex.exerciseName })}
                          aria-label="Remove exercise"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">Each set = load × repetitions</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {ex.sets.map((s, si) => (
                    <div key={si} className="flex items-center gap-1.5 rounded-md bg-canvas px-2.5 py-2 text-sm">
                      <span className="w-10 shrink-0 font-medium text-ink-secondary">Set {s.setNumber}</span>
                      <label className="flex shrink-0 items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={999}
                          step={0.5}
                          className="input-field !h-9 !w-14 !min-w-0 !px-1.5 text-center"
                          placeholder="kg"
                          value={s.weight ?? ''}
                          onChange={(e) =>
                            updateSet(
                              exIndex,
                              si,
                              'weight',
                              e.target.value === '' ? undefined : Number(e.target.value),
                            )
                          }
                        />
                        <span className="text-xs text-ink-muted">kg</span>
                      </label>
                      <span className="shrink-0 text-ink-muted">×</span>
                      <label className="flex shrink-0 items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          className="input-field !h-9 !w-11 !min-w-0 !px-1.5 text-center"
                          value={s.reps}
                          onChange={(e) => updateSet(exIndex, si, 'reps', Number(e.target.value))}
                        />
                        <span className="text-xs text-ink-muted">reps</span>
                      </label>
                      {ex.sets.length > 1 && (
                        <button
                          type="button"
                          className="ml-auto text-xs text-danger hover:underline"
                          onClick={() => removeSet(exIndex, si)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-brand-600 hover:underline"
                  onClick={() => addSet(exIndex)}
                >
                  + Add set
                </button>
              </div>
            ))}
            {!currentDay.exercises.length && (
              <p className="rounded-lg border border-dashed border-line py-8 text-center text-sm text-ink-muted">
                No exercises for this day — add from the library →
              </p>
            )}
          </div>
        </section>

        <ExerciseLibraryPicker onAdd={addExercise} />
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove exercise?"
        message={
          removeTarget
            ? `Remove "${removeTarget.name}" from ${WEEKDAY_LABELS[activeTab]}?`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={() => removeTarget && removeExercise(removeTarget.index)}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
}
