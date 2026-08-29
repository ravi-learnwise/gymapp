import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { api } from '../../lib/api';
import { WEEKDAY_LABELS, type TrainingPlanTemplate, type TrainingPlanTemplateListItem } from '../../types/training-card';

type TrainingTemplatePickerProps = {
  open: boolean;
  onSelect: (template: TrainingPlanTemplate) => void;
  onCancel: () => void;
};

export default function TrainingTemplatePicker({ open, onSelect, onCancel }: TrainingTemplatePickerProps) {
  const [items, setItems] = useState<TrainingPlanTemplateListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setError('');
    setLoading(true);
    api<TrainingPlanTemplateListItem[]>('/training-plan-templates?activeOnly=true')
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load templates'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = items.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase()));

  const pick = async (id: string) => {
    try {
      const full = await api<TrainingPlanTemplate>(`/training-plan-templates/${id}`);
      onSelect(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onCancel} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-line bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-ink">Use a training plan template</h3>
        <input
          className="input-field mt-4 !h-11 w-full"
          placeholder="Search templates"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              {t.description && <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">{t.description}</p>}
              <p className="mt-2 flex flex-wrap gap-1 text-[11px] text-ink-muted">
                {WEEKDAY_LABELS.map((label, i) => {
                  const day = t.days.find((d) => d.weekday === i);
                  const count = day?._count.exercises ?? 0;
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
