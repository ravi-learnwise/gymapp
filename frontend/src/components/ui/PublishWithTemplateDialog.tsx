import { useEffect, useState } from 'react';
import Button from './Button';

type PublishWithTemplateDialogProps = {
  open: boolean;
  planKind: 'training' | 'diet';
  suggestedTemplateName: string;
  onConfirm: (saveAsTemplate: boolean, templateName: string) => void;
  onCancel: () => void;
};

export default function PublishWithTemplateDialog({
  open,
  planKind,
  suggestedTemplateName,
  onConfirm,
  onCancel,
}: PublishWithTemplateDialogProps) {
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);
  const [templateName, setTemplateName] = useState(suggestedTemplateName);
  const label = planKind === 'training' ? 'training plan' : 'diet plan';

  useEffect(() => {
    if (open) {
      setSaveAsTemplate(true);
      setTemplateName(suggestedTemplateName);
    }
  }, [open, suggestedTemplateName]);

  if (!open) return null;

  const canConfirm = !saveAsTemplate || templateName.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close dialog" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-ink">Publish {label}?</h3>
        <p className="mt-2 text-sm text-ink-secondary">
          This will assign the plan to the member until the review date.
        </p>
        <label className="mt-4 flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
          />
          <span>Also save this as a {label} template so it can be reused for other members</span>
        </label>
        {saveAsTemplate && (
          <label className="mt-3 block">
            <span className="form-label">Template name</span>
            <input
              className="input-field mt-1 !h-11 w-full"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </label>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!canConfirm} onClick={() => onConfirm(saveAsTemplate, templateName.trim())}>
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
