import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { Ban, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ExerciseDetailModal from '../../components/exercises/ExerciseDetailModal';
import ExerciseSearchFilter from '../../components/exercises/ExerciseSearchFilter';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { api, apiUpload } from '../../lib/api';
import { BODY_PARTS, type Exercise, type ExerciseType } from '../../types/training-card';

const TYPE_OPTIONS: ExerciseType[] = ['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'BODYWEIGHT', 'OTHER'];

const emptyForm = {
  name: '',
  bodyPart: '',
  primaryMuscle: '',
  secondaryMuscles: '',
  equipment: '',
  type: 'STRENGTH' as ExerciseType,
  technique: '',
  safetyNotes: '',
  imageUrl: '',
};

export default function ExerciseLibraryPage() {
  const { user } = useAuth();
  const readOnly = user?.role === 'MANAGER';
  const canDeactivate = !readOnly && user?.role === 'OWNER';

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Exercise | null>(null);

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

  const onImageChange = (file: File | null) => {
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const addExercise = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || readOnly) return;
    setSaving(true);
    try {
      let imageUrl = form.imageUrl || undefined;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const uploaded = await apiUpload<{ imageUrl: string }>('/exercises/upload-image', fd);
        imageUrl = uploaded.imageUrl;
      }
      await api('/exercises', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          bodyPart: form.bodyPart || undefined,
          primaryMuscle: form.primaryMuscle || undefined,
          secondaryMuscles: form.secondaryMuscles || undefined,
          equipment: form.equipment || undefined,
          type: form.type,
          technique: form.technique || undefined,
          safetyNotes: form.safetyNotes || undefined,
          imageUrl,
        }),
      });
      setForm(emptyForm);
      onImageChange(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    await api(`/exercises/${deactivateTarget.id}`, { method: 'DELETE' });
    setDeactivateTarget(null);
    if (detail?.id === deactivateTarget.id) setDetail(null);
    load();
  };

  return (
    <div>
      <h2 className="text-2xl">Exercise Library</h2>
      <p className="mt-1 text-sm text-ink-secondary">
        Illustrated exercise catalog for training plans. {readOnly && 'Read-only for managers.'}
      </p>

      <div className="page-panel mt-6">
        <ExerciseSearchFilter
          search={search}
          bodyPart={bodyPart}
          onSearchChange={setSearch}
          onBodyPartChange={setBodyPart}
          onSelectSuggestion={(ex) => setDetail(ex)}
        />
      </div>

      {!readOnly && (
        <form onSubmit={addExercise} className="page-panel mt-6">
          <h3 className="text-lg font-semibold text-ink">Add new exercise to library</h3>
          <p className="mt-1 text-sm text-ink-secondary">Only the exercise name is required.</p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Exercise name" required className="sm:col-span-2">
              <input
                className="input-field !h-12"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Barbell Bench Press"
                required
              />
            </Field>

            <Field label="Body part">
              <select
                className="select-field w-full !h-12"
                value={form.bodyPart}
                onChange={(e) => setForm({ ...form, bodyPart: e.target.value })}
              >
                <option value="">Select body part</option>
                {BODY_PARTS.map((bp) => (
                  <option key={bp} value={bp}>{bp}</option>
                ))}
              </select>
            </Field>

            <Field label="Exercise type">
              <select
                className="select-field w-full !h-12"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ExerciseType })}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Primary muscle">
              <input
                className="input-field !h-12"
                value={form.primaryMuscle}
                onChange={(e) => setForm({ ...form, primaryMuscle: e.target.value })}
                placeholder="e.g. Pectoralis major"
              />
            </Field>

            <Field label="Secondary muscles">
              <input
                className="input-field !h-12"
                value={form.secondaryMuscles}
                onChange={(e) => setForm({ ...form, secondaryMuscles: e.target.value })}
                placeholder="e.g. Triceps, anterior deltoid"
              />
            </Field>

            <Field label="Equipment" className="sm:col-span-2">
              <input
                className="input-field !h-12"
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                placeholder="e.g. Barbell, flat bench"
              />
            </Field>

            <Field label="Technique / execution" className="sm:col-span-2">
              <textarea
                className="input-field min-h-[7rem] resize-y py-3"
                rows={4}
                value={form.technique}
                onChange={(e) => setForm({ ...form, technique: e.target.value })}
                placeholder="Starting position, execution steps, form cues…"
              />
            </Field>

            <Field label="Safety notes" className="sm:col-span-2">
              <textarea
                className="input-field min-h-[5rem] resize-y py-3"
                rows={3}
                value={form.safetyNotes}
                onChange={(e) => setForm({ ...form, safetyNotes: e.target.value })}
                placeholder="Optional safety reminders"
              />
            </Field>

            <Field label="Illustration image" className="sm:col-span-2">
              <input
                type="file"
                accept="image/*"
                className="input-field !h-auto cursor-pointer py-3 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-600"
                onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-3 h-32 w-32 rounded-lg border border-line object-cover"
                />
              )}
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding…' : 'Add exercise'}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-ink">
          {exercises.length} exercise{exercises.length === 1 ? '' : 's'}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {exercises.map((ex) => (
            <article
              key={ex.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => setDetail(ex)}
              >
                {ex.imageUrl ? (
                  <img
                    src={ex.imageUrl}
                    alt={ex.name}
                    className="h-40 w-full object-cover bg-canvas"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-canvas text-sm text-ink-muted">
                    No illustration
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-semibold text-ink line-clamp-2">{ex.name}</h4>
                  <p className="mt-1 text-xs text-ink-secondary">
                    {ex.bodyPart || '—'}
                    {ex.primaryMuscle && ` · ${ex.primaryMuscle}`}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">{ex.type}</p>
                </div>
              </button>

              <div className="flex items-center justify-between border-t border-line px-3 py-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
                  onClick={() => setDetail(ex)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View details
                </button>
                {canDeactivate && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft"
                    onClick={() => setDeactivateTarget(ex)}
                    aria-label={`Deactivate ${ex.name}`}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Deactivate
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!exercises.length && (
          <p className="mt-8 text-center text-sm text-ink-muted">No exercises match your filters</p>
        )}
      </div>

      <ExerciseDetailModal exercise={detail} onClose={() => setDetail(null)} />

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate exercise?"
        message={
          deactivateTarget
            ? `"${deactivateTarget.name}" will be hidden from the library. Existing training plans that reference it will not be affected.`
            : ''
        }
        confirmLabel="Deactivate"
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}

function Field({
  label,
  required,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="form-label">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}
