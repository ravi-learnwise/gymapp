import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import ExerciseLibraryPicker from '../../components/exercises/ExerciseLibraryPicker';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { api } from '../../lib/api';
import {
  DAY_TYPE_LABELS,
  WEEKDAY_LABELS,
  type Exercise,
  type TrainingCard,
  type TrainingDayType,
} from '../../types/training-card';

type SetDraft = {
  setNumber: number;
  reps: number;
  weight?: number;
  weightUnit: 'KG' | 'LB';
};

type ExerciseDraft = {
  exerciseId: string;
  exerciseName: string;
  imageUrl?: string;
  sectionName?: string;
  restSeconds?: number;
  sets: SetDraft[];
};

type DayDraft = {
  weekday: number;
  dayType: TrainingDayType;
  notes?: string;
  exercises: ExerciseDraft[];
};

const ACTIVITY_TYPES: TrainingDayType[] = ['NOT_ASSIGNED', 'WORKOUT', 'REST', 'RECOVERY'];

function emptyDays(): DayDraft[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    dayType: 'NOT_ASSIGNED' as TrainingDayType,
    exercises: [],
  }));
}

function cardToDays(card: TrainingCard): DayDraft[] {
  const base = emptyDays();
  for (const day of card.days) {
    base[day.weekday] = {
      weekday: day.weekday,
      dayType: day.dayType,
      notes: day.notes ?? undefined,
      exercises: day.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exercise.name,
        imageUrl: ex.exercise.imageUrl ?? undefined,
        sectionName: ex.sectionName ?? undefined,
        restSeconds: ex.restSeconds ?? undefined,
        sets: ex.sets.map((s) => ({
          setNumber: s.setNumber,
          reps: s.repMax ?? s.repMin,
          weight: s.weight ? Number(s.weight) : undefined,
          weightUnit: s.weightUnit ?? 'KG',
        })),
      })),
    };
  }
  return base;
}

export default function TrainingCardEditorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname.includes('/training-card/new');
  const memberId = isNew ? id : undefined;
  const cardId = isNew ? undefined : id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [memberName, setMemberName] = useState('');
  const [days, setDays] = useState<DayDraft[]>(emptyDays());
  const [activeTab, setActiveTab] = useState(1);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('DRAFT');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ index: number; name: string } | null>(null);

  useEffect(() => {
    if (isNew && memberId) {
      api<{ fullName: string }>(`/members/${memberId}`)
        .then((m) => {
          setMemberName(m.fullName);
          setName((prev) => prev || defaultPlanName(m.fullName));
        })
        .catch(() => undefined);
    }
  }, [isNew, memberId]);

  useEffect(() => {
    if (isNew || !cardId) return;
    api<TrainingCard>(`/training-cards/${cardId}`).then((card) => {
      setExistingId(card.id);
      setName(card.name);
      setDescription(card.description ?? '');
      setReviewDate(card.reviewDate ? card.reviewDate.slice(0, 10) : '');
      setDays(cardToDays(card));
      setStatus(card.status);
      setMemberName(card.member?.fullName ?? '');
    });
  }, [cardId, isNew]);

  const currentDay = days[activeTab];

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

  const buildPayload = () => ({
    name,
    description: description || undefined,
    reviewDate: reviewDate || undefined,
    days: days.map((d) => ({
      weekday: d.weekday,
      dayType: d.dayType,
      notes: d.notes,
      displayOrder: d.weekday,
      exercises: d.exercises.map((ex, i) => ({
        exerciseId: ex.exerciseId,
        sectionName: ex.sectionName,
        displayOrder: i,
        restSeconds: ex.restSeconds,
        sets: ex.sets.map((s) => ({
          setNumber: s.setNumber,
          repMin: s.reps,
          repMax: s.reps,
          weight: s.weight,
          weightUnit: s.weightUnit,
        })),
      })),
    })),
  });

  const saveDraft = async () => {
    setSaving(true);
    setMessage('');
    try {
      if (existingId) {
        await api(`/training-cards/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify(buildPayload()),
        });
        setMessage('Draft saved');
      } else if (memberId) {
        const created = await api<TrainingCard>('/training-cards', {
          method: 'POST',
          body: JSON.stringify({ memberId, ...buildPayload() }),
        });
        setExistingId(created.id);
        setMessage('Draft created');
        navigate(`/training-cards/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setSaving(true);
    setMessage('');
    try {
      let id = existingId;
      if (!id && memberId) {
        const created = await api<TrainingCard>('/training-cards', {
          method: 'POST',
          body: JSON.stringify({ memberId, ...buildPayload() }),
        });
        id = created.id;
        setExistingId(created.id);
        navigate(`/training-cards/${created.id}/edit`, { replace: true });
      } else if (id) {
        await api(`/training-cards/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(buildPayload()),
        });
      }
      if (!id) return;
      await api(`/training-cards/${id}/publish`, { method: 'POST', body: '{}' });
      setStatus('ACTIVE');
      setMessage('Published — now active for member');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  const planPlaceholder = useMemo(
    () => defaultPlanName(memberName || 'Member'),
    [memberName],
  );

  const backLink = memberId ? `/members/${memberId}/training-card` : '/members';

  return (
    <div className="max-w-6xl">
      <Link to={backLink} className="text-sm text-brand-600 hover:underline">
        ← Back
      </Link>
      <h2 className="mt-3 text-2xl">Training Plan Builder</h2>
      <p className="text-sm text-ink-secondary">
        Status: <span className="font-medium text-ink">{status}</span>
        {memberName && <> · Member: {memberName}</>}
      </p>

      <section className="page-panel mt-6">
        <h3 className="text-lg font-semibold text-ink">Plan details</h3>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="form-label">Plan name</span>
            <input
              className="input-field !h-12"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={planPlaceholder}
            />
          </label>
          <label className="block">
            <span className="form-label">Review date</span>
            <input
              type="date"
              className="input-field !h-12"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
          </label>
          <label className="block lg:col-span-2">
            <span className="form-label">Description</span>
            <textarea
              className="input-field min-h-[6rem] resize-y py-3"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals, focus areas, coach notes for this training plan…"
            />
          </label>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === i ? 'bg-brand-600 text-white' : 'bg-neutral-soft text-ink-secondary hover:bg-brand-50'
            }`}
            onClick={() => setActiveTab(i)}
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

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" disabled={saving} onClick={saveDraft}>
          Save draft
        </Button>
        {status === 'DRAFT' && (
          <Button disabled={saving} onClick={publish}>
            Publish
          </Button>
        )}
      </div>
      {message && <p className="mt-3 text-sm text-ink-secondary">{message}</p>}

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
    </div>
  );
}

function defaultPlanName(member: string) {
  const month = new Date().toLocaleString('en-US', { month: 'long' });
  return `${month} Training Plan for ${member}`;
}
