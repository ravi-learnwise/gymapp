import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  DAY_TYPE_LABELS,
  WEEKDAY_LABELS,
  type Exercise,
  type TrainingCard,
  type TrainingCardDay,
  type TrainingDayType,
} from '../../types/training-card';

type SetDraft = {
  setNumber: number;
  repMin: number;
  repMax?: number;
  weight?: number;
  weightUnit?: 'KG' | 'LB';
};

type ExerciseDraft = {
  exerciseId: string;
  exerciseName: string;
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
        sectionName: ex.sectionName ?? undefined,
        restSeconds: ex.restSeconds ?? undefined,
        sets: ex.sets.map((s) => ({
          setNumber: s.setNumber,
          repMin: s.repMin,
          repMax: s.repMax ?? undefined,
          weight: s.weight ? Number(s.weight) : undefined,
          weightUnit: s.weightUnit ?? undefined,
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

  const [name, setName] = useState('Weekly Program');
  const [description, setDescription] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [days, setDays] = useState<DayDraft[]>(emptyDays());
  const [activeTab, setActiveTab] = useState(1);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('DRAFT');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Exercise[]>('/exercises').then(setLibrary);
  }, []);

  useEffect(() => {
    if (isNew || !cardId) return;
    api<TrainingCard>(`/training-cards/${cardId}`).then((card) => {
      setExistingId(card.id);
      setName(card.name);
      setDescription(card.description ?? '');
      setReviewDate(card.reviewDate ? card.reviewDate.slice(0, 10) : '');
      setDays(cardToDays(card));
      setStatus(card.status);
    });
  }, [cardId, isNew]);

  const filteredLibrary = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return library.slice(0, 20);
    return library.filter((e) => e.name.toLowerCase().includes(s)).slice(0, 20);
  }, [library, search]);

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
                  sets: [{ setNumber: 1, repMin: 10 }],
                },
              ],
            }
          : d,
      ),
    );
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

  const updateSet = (exIndex: number, setIndex: number, field: keyof SetDraft, value: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== activeTab) return d;
        const exercises = d.exercises.map((ex, ei) => {
          if (ei !== exIndex) return ex;
          const sets = ex.sets.map((s, si) => (si === setIndex ? { ...s, [field]: value } : s));
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
          return {
            ...ex,
            sets: [...ex.sets, { setNumber: ex.sets.length + 1, repMin: 10 }],
          };
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
          repMin: s.repMin,
          repMax: s.repMax,
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
    if (!existingId) {
      await saveDraft();
    }
    const id = existingId;
    if (!id) return;
    setSaving(true);
    try {
      await api(`/training-cards/${id}/publish`, { method: 'POST', body: '{}' });
      setStatus('ACTIVE');
      setMessage('Published — now active for member');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  const backLink = memberId ? `/members/${memberId}/training-card` : '/members';

  return (
    <div className="max-w-5xl">
      <Link to={backLink} className="text-sm text-brand-600 hover:underline">
        ← Back
      </Link>
      <h2 className="mt-3 text-2xl">Training Card Editor</h2>
      <p className="text-sm text-ink-secondary">Status: {status}</p>

      <div className="mt-4 grid gap-4 rounded-xl border border-line bg-white p-5 lg:grid-cols-2">
        <label className="block text-sm">
          Name
          <input className="input mt-1 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm">
          Review date
          <input type="date" className="input mt-1 w-full" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
        </label>
        <label className="block text-sm lg:col-span-2">
          Description
          <textarea className="input mt-1 w-full" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${activeTab === i ? 'bg-brand-600 text-white' : 'bg-neutral-soft'}`}
            onClick={() => setActiveTab(i)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5">
          <label className="block text-sm">
            Day type
            <select
              className="input mt-1 w-full"
              value={currentDay.dayType}
              onChange={(e) =>
                setDays((prev) =>
                  prev.map((d) =>
                    d.weekday === activeTab ? { ...d, dayType: e.target.value as TrainingDayType } : d,
                  ),
                )
              }
            >
              {Object.entries(DAY_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>

          <div className="mt-4 space-y-4">
            {currentDay.exercises.map((ex, exIndex) => (
              <div key={`${ex.exerciseId}-${exIndex}`} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{ex.exerciseName}</p>
                  <div className="flex gap-1">
                    <button type="button" className="btn btn-ghost !px-2 !py-1" onClick={() => moveExercise(exIndex, -1)}>↑</button>
                    <button type="button" className="btn btn-ghost !px-2 !py-1" onClick={() => moveExercise(exIndex, 1)}>↓</button>
                  </div>
                </div>
                {ex.sets.map((s, si) => (
                  <div key={si} className="mt-2 grid grid-cols-4 gap-2">
                    <span>Set {s.setNumber}</span>
                    <input
                      type="number"
                      className="input"
                      value={s.repMin}
                      onChange={(e) => updateSet(exIndex, si, 'repMin', Number(e.target.value))}
                    />
                    <input
                      type="number"
                      className="input"
                      placeholder="kg"
                      value={s.weight ?? ''}
                      onChange={(e) => updateSet(exIndex, si, 'weight', Number(e.target.value))}
                    />
                  </div>
                ))}
                <button type="button" className="mt-2 text-brand-600 hover:underline" onClick={() => addSet(exIndex)}>
                  + Add set
                </button>
              </div>
            ))}
            {!currentDay.exercises.length && <p className="text-ink-muted">No exercises for this day</p>}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-5">
          <h3 className="font-semibold">Exercise library</h3>
          <input
            className="input mt-2 w-full"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto">
            {filteredLibrary.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-canvas"
                  onClick={() => addExercise(ex)}
                >
                  {ex.name}
                  <span className="block text-xs text-ink-muted">{ex.muscleGroups}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-secondary" disabled={saving} onClick={saveDraft}>
          Save draft
        </button>
        {status === 'DRAFT' && (
          <button type="button" className="btn btn-primary" disabled={saving} onClick={publish}>
            Publish
          </button>
        )}
      </div>
      {message && <p className="mt-3 text-sm text-ink-secondary">{message}</p>}
    </div>
  );
}
