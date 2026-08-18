import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Exercise, ExerciseType } from '../../types/training-card';

const TYPE_OPTIONS: ExerciseType[] = ['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'BODYWEIGHT', 'OTHER'];

export default function ExerciseLibraryPage() {
  const { user } = useAuth();
  const readOnly = user?.role === 'MANAGER';
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [muscleGroups, setMuscleGroups] = useState('');
  const [equipment, setEquipment] = useState('');
  const [type, setType] = useState<ExerciseType>('STRENGTH');

  const load = () => {
    const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    api<Exercise[]>(`/exercises${qs}`).then(setExercises);
  };

  useEffect(() => {
    load();
  }, []);

  const addExercise = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || readOnly) return;
    await api('/exercises', {
      method: 'POST',
      body: JSON.stringify({ name, muscleGroups, equipment, type }),
    });
    setName('');
    setMuscleGroups('');
    setEquipment('');
    load();
  };

  const deactivate = async (id: string) => {
    if (readOnly || !confirm('Deactivate this exercise?')) return;
    await api(`/exercises/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h2 className="text-2xl">Exercise Library</h2>
      <p className="mt-1 text-sm text-ink-secondary">
        Central exercise catalog for training cards. {readOnly && 'Read-only for managers.'}
      </p>

      <div className="mt-4 flex gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search exercises…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn btn-secondary" onClick={load}>
          Search
        </button>
      </div>

      {!readOnly && (
        <form onSubmit={addExercise} className="mt-6 grid gap-3 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
          <input className="input" placeholder="Exercise name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" placeholder="Muscle groups" value={muscleGroups} onChange={(e) => setMuscleGroups(e.target.value)} />
          <input className="input" placeholder="Equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
          <select className="input" value={type} onChange={(e) => setType(e.target.value as ExerciseType)}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary sm:col-span-2">Add exercise</button>
        </form>
      )}

      <ul className="mt-6 divide-y rounded-xl border border-line bg-white">
        {exercises.map((ex) => (
          <li key={ex.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{ex.name}</p>
              <p className="text-ink-secondary">{ex.muscleGroups || '—'} · {ex.equipment || 'No equipment'} · {ex.type}</p>
            </div>
            {!readOnly && user?.role === 'OWNER' && (
              <button type="button" className="text-red-600 hover:underline" onClick={() => deactivate(ex.id)}>
                Deactivate
              </button>
            )}
          </li>
        ))}
        {!exercises.length && <li className="px-4 py-6 text-ink-muted">No exercises found</li>}
      </ul>
    </div>
  );
}
