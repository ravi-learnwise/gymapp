import { useEffect, useState } from 'react';
import { WEEKDAY_LABELS } from '../../types/diet-plan';
import Button from '../ui/Button';

type CopyDayDialogProps = {
  open: boolean;
  sourceWeekday: number;
  onConfirm: (targetWeekdays: number[], replaceExisting: boolean) => void;
  onCancel: () => void;
};

export default function CopyDayDialog({
  open,
  sourceWeekday,
  onConfirm,
  onCancel,
}: CopyDayDialogProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setReplaceExisting(false);
    }
  }, [open, sourceWeekday]);

  if (!open) return null;

  const toggle = (weekday: number) => {
    setSelected((prev) =>
      prev.includes(weekday) ? prev.filter((w) => w !== weekday) : [...prev, weekday],
    );
  };

  const applyToWeek = () => {
    setSelected(WEEKDAY_LABELS.map((_, i) => i).filter((i) => i !== sourceWeekday));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-ink">
          Copy {WEEKDAY_LABELS[sourceWeekday]}&apos;s plan
        </h3>
        <p className="mt-1 text-sm text-ink-secondary">Select days to copy to. Each copy is independent.</p>

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

        <button type="button" className="mt-3 text-sm text-brand-600 hover:underline" onClick={applyToWeek}>
          Select all other days (apply to week)
        </button>

        <label className="mt-4 flex items-center gap-2 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
          />
          Replace existing content on target days
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button
            disabled={!selected.length}
            onClick={() => onConfirm(selected, replaceExisting)}
          >
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
