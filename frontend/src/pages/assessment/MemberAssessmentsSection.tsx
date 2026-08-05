import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { CreateAssessmentInput, FitnessAssessment } from '../../types/assessment';
import { trainerName } from '../../types/member';

type Props = {
  memberId: string;
  canEdit: boolean;
};

export default function MemberAssessmentsSection({ memberId, canEdit }: Props) {
  const [assessments, setAssessments] = useState<FitnessAssessment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAssessmentInput>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api<FitnessAssessment[]>(`/members/${memberId}/assessments`)
      .then(setAssessments)
      .catch(() => setAssessments([]));
  };

  useEffect(() => {
    load();
  }, [memberId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api(`/members/${memberId}/assessments`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({});
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Fitness Assessments</h3>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700"
          >
            {showForm ? 'Cancel' : 'New Assessment'}
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['height', 'Height (cm)'],
            ['weight', 'Weight (kg)'],
            ['bodyFat', 'Body Fat (%)'],
            ['waist', 'Waist (cm)'],
            ['chest', 'Chest (cm)'],
            ['hip', 'Hip (cm)'],
            ['arm', 'Arm (cm)'],
            ['thigh', 'Thigh (cm)'],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="text-slate-600">{label}</span>
              <input
                type="number"
                step="0.1"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form[key as keyof CreateAssessmentInput] ?? ''}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </label>
          ))}
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Medical History</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={2}
              value={form.medicalHistory ?? ''}
              onChange={(e) => setForm({ ...form, medicalHistory: e.target.value || undefined })}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Fitness Goals</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={2}
              value={form.fitnessGoals ?? ''}
              onChange={(e) => setForm({ ...form, fitnessGoals: e.target.value || undefined })}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Notes</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={2}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })}
            />
          </label>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Assessment'}
            </button>
          </div>
        </form>
      )}

      <ul className="mt-4 space-y-3">
        {assessments.map((a) => (
          <li key={a.id} className="rounded-lg border px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {new Date(a.assessedAt).toLocaleString()}
              </span>
              <span className="text-slate-500">
                by {trainerName(a.assessedBy)}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
              {a.height != null && <span>Height: {a.height} cm</span>}
              {a.weight != null && <span>Weight: {a.weight} kg</span>}
              {a.bmi != null && <span>BMI: {a.bmi}</span>}
              {a.bodyFat != null && <span>Body fat: {a.bodyFat}%</span>}
              {a.waist != null && <span>Waist: {a.waist} cm</span>}
              {a.chest != null && <span>Chest: {a.chest} cm</span>}
              {a.hip != null && <span>Hip: {a.hip} cm</span>}
              {a.arm != null && <span>Arm: {a.arm} cm</span>}
              {a.thigh != null && <span>Thigh: {a.thigh} cm</span>}
            </div>
            {a.fitnessGoals && (
              <p className="mt-2 text-slate-600">Goals: {a.fitnessGoals}</p>
            )}
            {a.medicalHistory && (
              <p className="mt-1 text-slate-600">Medical: {a.medicalHistory}</p>
            )}
            {a.notes && <p className="mt-1 text-slate-500 italic">{a.notes}</p>}
          </li>
        ))}
        {!assessments.length && (
          <li className="text-slate-400">No assessments recorded yet</li>
        )}
      </ul>
    </div>
  );
}
