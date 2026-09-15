import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import TrainingWeekBuilder from '../../components/training/TrainingWeekBuilder';
import {
  emptyTrainingDays,
  trainingDaysFromCard,
  trainingDaysPayload,
} from '../../components/training/training-week';
import Button from '../../components/ui/Button';
import { api } from '../../lib/api';
import type { TrainingPlanTemplate } from '../../types/training-card';

export default function TrainingPlanTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname.endsWith('/new');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState(emptyTrainingDays());
  const [activeTab, setActiveTab] = useState(1);
  const [existingId, setExistingId] = useState<string | null>(isNew ? null : id ?? null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !id) return;
    api<TrainingPlanTemplate>(`/training-plan-templates/${id}`).then((tpl) => {
      setExistingId(tpl.id);
      setName(tpl.name);
      setDescription(tpl.description ?? '');
      setDays(trainingDaysFromCard(tpl));
    });
  }, [id, isNew]);

  const save = async () => {
    if (name.trim().length < 2) {
      setMessage('Template name must be at least 2 characters');
      return;
    }
    setSaving(true);
    setMessage('');
    const body = {
      name: name.trim(),
      description: description || undefined,
      days: trainingDaysPayload(days),
    };
    try {
      if (existingId) {
        await api(`/training-plan-templates/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        setMessage('Template saved');
      } else {
        const created = await api<TrainingPlanTemplate>('/training-plan-templates', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setExistingId(created.id);
        setMessage('Template created');
        navigate(`/config/training-templates/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <Link to="/config/training-templates" className="text-sm text-brand-600 hover:underline">
        ← Back to templates
      </Link>
      <h2 className="mt-3 text-2xl">{isNew && !existingId ? 'New training plan template' : 'Edit training plan template'}</h2>
      <p className="text-sm text-ink-secondary">Gym-level recipe — not assigned to a member.</p>

      <section className="page-panel mt-6">
        <h3 className="text-lg font-semibold text-ink">Template details</h3>
        <div className="mt-4 grid gap-5">
          <label className="block">
            <span className="form-label">Template name</span>
            <input
              className="input-field !h-12"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beginner Strength — Phase 1"
            />
          </label>
          <label className="block">
            <span className="form-label">Description</span>
            <textarea
              className="input-field min-h-[6rem] resize-y py-3"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When to use this template, who it is for…"
            />
          </label>
        </div>
      </section>

      <TrainingWeekBuilder
        days={days}
        onDaysChange={setDays}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button disabled={saving} onClick={save}>
          Save template
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-ink-secondary">{message}</p>}
    </div>
  );
}
