import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { api } from '../../lib/api';
import {
  OBJECTIVE_LABELS,
  WEEKDAY_LABELS,
  type DietPlanObjective,
  type DietPlanTemplate,
  type DietPlanTemplateListItem,
} from '../../types/diet-plan';

type DietTemplatePickerProps = {
  open: boolean;
  onSelect: (template: DietPlanTemplate) => void;
  onCancel: () => void;
};

export default function DietTemplatePicker({ open, onSelect, onCancel }: DietTemplatePickerProps) {
  const [items, setItems] = useState<DietPlanTemplateListItem[]>([]);
  const [search, setSearch] = useState('');
  const [objective, setObjective] = useState<'' | DietPlanObjective>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = (obj: '' | DietPlanObjective) => {
    setLoading(true);
    const qs = new URLSearchParams({ activeOnly: 'true' });
    if (obj) qs.set('objective', obj);
    api<DietPlanTemplateListItem[]>(`/diet-plan-templates?${qs.toString()}`)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load templates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setObjective('');
    setError('');
    load('');
  }, [open]);

  if (!open) return null;

  const filtered = items.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase()));

  const pick = async (id: string) => {
    try {
      const full = await api<DietPlanTemplate>(`/diet-plan-templates/${id}`);
      onSelect(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onCancel} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-line bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-ink">Use a diet plan template</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            className="input-field !h-11 w-full"
            placeholder="Search templates"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-field !h-11 w-full"
            value={objective}
            onChange={(e) => {
              const next = e.target.value as '' | DietPlanObjective;
              setObjective(next);
              load(next);
            }}
          >
            <option value="">All objectives</option>
            {(Object.entries(OBJECTIVE_LABELS) as [DietPlanObjective, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {loading && <p className="text-sm text-ink-muted">Loading…</p>}
          {!loading && !filtered.length && (
            <p className="text-sm text-ink-muted">No active templates yet. Create one from Config, or start from scratch.</p>
          )}
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              className="w-full rounded-lg border border-line px-4 py-3 text-left hover:border-brand-200 hover:bg-brand-50"
              onClick={() => pick(t.id)}
            >
              <p className="font-medium text-ink">{t.name}</p>
              <p className="mt-0.5 text-xs text-ink-secondary">{OBJECTIVE_LABELS[t.objective]}</p>
              <p className="mt-2 flex flex-wrap gap-1 text-[11px] text-ink-muted">
                {WEEKDAY_LABELS.map((label, i) => {
                  const day = t.days.find((d) => d.weekday === i);
                  const count = day?._count.meals ?? 0;
                  return (
                    <span
                      key={label}
                      className={`rounded px-1.5 py-0.5 ${count ? 'bg-brand-50 text-brand-700' : 'bg-canvas'}`}
                    >
                      {label}{count ? ` ${count}` : ''}
                    </span>
                  );
                })}
              </p>
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
