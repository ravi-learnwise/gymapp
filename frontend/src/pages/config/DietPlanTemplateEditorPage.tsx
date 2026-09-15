import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import DietWeekBuilder from '../../components/diet/DietWeekBuilder';
import { emptyDietDays, dietDaysFromPlan, dietDaysPayload } from '../../components/diet/diet-week';
import Button from '../../components/ui/Button';
import { api } from '../../lib/api';
import {
  OBJECTIVE_LABELS,
  type DietPlanObjective,
  type DietPlanTemplate,
} from '../../types/diet-plan';

export default function DietPlanTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname.endsWith('/new');

  const [name, setName] = useState('');
  const [objective, setObjective] = useState<DietPlanObjective>('GENERAL_FITNESS');
  const [description, setDescription] = useState('');
  const [hydrationGoal, setHydrationGoal] = useState('');
  const [days, setDays] = useState(emptyDietDays());
  const [activeTab, setActiveTab] = useState(new Date().getDay());
  const [existingId, setExistingId] = useState<string | null>(isNew ? null : id ?? null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !id) return;
    api<DietPlanTemplate>(`/diet-plan-templates/${id}`).then((tpl) => {
      setExistingId(tpl.id);
      setName(tpl.name);
      setObjective(tpl.objective);
      setDescription(tpl.description ?? '');
      setHydrationGoal(tpl.hydrationGoal ?? '');
      setDays(dietDaysFromPlan(tpl));
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
      objective,
      description: description || undefined,
      hydrationGoal: hydrationGoal || undefined,
      days: dietDaysPayload(days),
    };
    try {
      if (existingId) {
        await api(`/diet-plan-templates/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        setMessage('Template saved');
      } else {
        const created = await api<DietPlanTemplate>('/diet-plan-templates', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setExistingId(created.id);
        setMessage('Template created');
        navigate(`/config/diet-templates/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <Link to="/config/diet-templates" className="text-sm text-brand-600 hover:underline">
        ← Back to templates
      </Link>
      <h2 className="mt-3 text-2xl">{isNew && !existingId ? 'New diet plan template' : 'Edit diet plan template'}</h2>
      <p className="text-sm text-ink-secondary">Gym-level recipe — not assigned to a member.</p>

      <section className="page-panel mt-6">
        <h3 className="text-lg font-semibold text-ink">Template details</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="form-label">Template name</span>
            <input
              className="input-field !h-12 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. General Fitness — Vegetarian"
            />
          </label>
          <label className="block">
            <span className="form-label">Objective</span>
            <select
              className="select-field w-full !h-12"
              value={objective}
              onChange={(e) => setObjective(e.target.value as DietPlanObjective)}
            >
              {(Object.entries(OBJECTIVE_LABELS) as [DietPlanObjective, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="form-label">General instructions</span>
            <textarea
              className="input-field min-h-[5rem] w-full py-3"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="form-label">Daily hydration goal</span>
            <input
              className="input-field !h-12 w-full"
              value={hydrationGoal}
              onChange={(e) => setHydrationGoal(e.target.value)}
              placeholder="e.g. 2.5 litres/day"
            />
          </label>
        </div>
      </section>

      <DietWeekBuilder
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
