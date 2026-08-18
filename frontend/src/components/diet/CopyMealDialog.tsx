import { useEffect, useState } from 'react';
import { WEEKDAY_LABELS } from '../../types/diet-plan';
import Button from '../ui/Button';

type CopyMealDialogProps = {
  open: boolean;
  mealLabel: string;
  sourceWeekday: number;
  onConfirm: (targetWeekdays: number[], replaceExisting: boolean) => void;
  onCancel: () => void;
};

export default function CopyMealDialog({
  open,
  mealLabel,
  sourceWeekday,
  onConfirm,
  onCancel,
}: CopyMealDialogProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setReplaceExisting(false);
    }
  }, [open]);

  if (!open) return null;

  const toggle = (weekday: number) => {
    setSelected((prev) =>
      prev.includes(weekday) ? prev.filter((w) => w !== weekday) : [...prev, weekday],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-ink">Copy {mealLabel}</h3>
        <p className="mt-1 text-sm text-ink-secondary">From {WEEKDAY_LABELS[sourceWeekday]} to:</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {WEEKDAY_LABELS.map((label, weekday) => (
            <label
              key={label}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                weekday === sourceWeekday
                  ? 'border-line bg-canvas text-ink-muted'
                  : selected.includes(weekday)
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-line'
              }`}
            >
              <input
                type="checkbox"
                disabled={weekday === sourceWeekday}
                checked={selected.includes(weekday)}
                onChange={() => toggle(weekday)}
              />
              {label}
            </label>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
          />
          Replace same meal type on target days
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button disabled={!selected.length} onClick={() => onConfirm(selected, replaceExisting)}>
            Copy meal
          </Button>
        </div>
      </div>
    </div>
  );
}
