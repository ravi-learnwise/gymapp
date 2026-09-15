import { useEffect, useState } from 'react';
import Button from './Button';

type SaveAsTemplateDialogProps = {
  open: boolean;
  suggestedName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
};

export default function SaveAsTemplateDialog({
  open,
  suggestedName,
  onConfirm,
  onCancel,
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState(suggestedName);

  useEffect(() => {
    if (open) setName(suggestedName);
  }, [open, suggestedName]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close dialog" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-ink">Save as template</h3>
        <p className="mt-2 text-sm text-ink-secondary">
          Store a copy of this week in the template library. The member plan is not changed.
        </p>
        <label className="mt-4 block">
          <span className="form-label">Template name</span>
          <input
            className="input-field mt-1 !h-11 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={name.trim().length < 2} onClick={() => onConfirm(name.trim())}>
            Save template
          </Button>
        </div>
      </div>
    </div>
  );
}
