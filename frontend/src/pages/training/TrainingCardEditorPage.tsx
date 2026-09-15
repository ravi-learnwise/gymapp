import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import TrainingWeekBuilder from '../../components/training/TrainingWeekBuilder';
import TrainingTemplatePicker from '../../components/training/TrainingTemplatePicker';
import {
  emptyTrainingDays,
  trainingDaysFromCard,
  trainingDaysPayload,
} from '../../components/training/training-week';
import Button from '../../components/ui/Button';
import PublishWithTemplateDialog from '../../components/ui/PublishWithTemplateDialog';
import SaveAsTemplateDialog from '../../components/ui/SaveAsTemplateDialog';
import { api } from '../../lib/api';
import { suggestTemplateName } from '../../lib/plan-templates';
import type { TrainingCard, TrainingPlanTemplate } from '../../types/training-card';

export default function TrainingCardEditorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname.includes('/training-card/new');
  const memberId = isNew ? id : undefined;
  const cardId = isNew ? undefined : id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [memberName, setMemberName] = useState('');
  const [days, setDays] = useState(emptyTrainingDays());
  const [activeTab, setActiveTab] = useState(1);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('DRAFT');
  const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(null);
  const [previousVersionId, setPreviousVersionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  useEffect(() => {
    if (isNew && memberId) {
      api<{ fullName: string }>(`/members/${memberId}`)
        .then((m) => {
          setMemberName(m.fullName);
          setName((prev) => prev || defaultPlanName(m.fullName));
        })
        .catch(() => undefined);
    }
  }, [isNew, memberId]);

  useEffect(() => {
    if (isNew || !cardId) return;
    api<TrainingCard>(`/training-cards/${cardId}`).then((card) => {
      setExistingId(card.id);
      setName(card.name);
      setDescription(card.description ?? '');
      setReviewDate(card.reviewDate ? card.reviewDate.slice(0, 10) : '');
      setDays(trainingDaysFromCard(card));
      setStatus(card.status);
      setMemberName(card.member?.fullName ?? '');
      setSourceTemplateId(card.sourceTemplateId ?? null);
      setPreviousVersionId(card.previousVersionId);
    });
  }, [cardId, isNew]);

  const startedFromScratch = !sourceTemplateId && !previousVersionId;
  const weekHasContent = days.some((d) => d.exercises.length > 0);

  const applyTemplate = (tpl: TrainingPlanTemplate) => {
    const apply = () => {
      setDays(trainingDaysFromCard(tpl));
      setSourceTemplateId(tpl.id);
      setDescription(tpl.description ?? '');
      if (memberName) {
        setName(`${tpl.name} for ${memberName}`);
      } else {
        setName(tpl.name);
      }
      setPickerOpen(false);
    };
    if (weekHasContent && !window.confirm('Replace the current week with this template?')) {
      return;
    }
    apply();
  };

  const buildPayload = () => ({
    name,
    description: description || undefined,
    reviewDate: reviewDate || undefined,
    sourceTemplateId: sourceTemplateId || undefined,
    days: trainingDaysPayload(days),
  });

  const saveDraft = async () => {
    setSaving(true);
    setMessage('');
    try {
      if (existingId) {
        await api(`/training-cards/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify(buildPayload()),
        });
        setMessage('Draft saved');
      } else if (memberId) {
        const created = await api<TrainingCard>('/training-cards', {
          method: 'POST',
          body: JSON.stringify({ memberId, ...buildPayload() }),
        });
        setExistingId(created.id);
        setMessage('Draft created');
        navigate(`/training-cards/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const publishMemberPlan = async () => {
    let planId = existingId;
    if (!planId && memberId) {
      const created = await api<TrainingCard>('/training-cards', {
        method: 'POST',
        body: JSON.stringify({ memberId, ...buildPayload() }),
      });
      planId = created.id;
      setExistingId(created.id);
      navigate(`/training-cards/${created.id}/edit`, { replace: true });
    } else if (planId) {
      await api(`/training-cards/${planId}`, {
        method: 'PATCH',
        body: JSON.stringify(buildPayload()),
      });
    }
    if (!planId) throw new Error('Could not save plan');
    await api(`/training-cards/${planId}/publish`, { method: 'POST', body: '{}' });
    setStatus('ACTIVE');
    return planId;
  };

  const handlePublishClick = () => {
    if (status !== 'DRAFT') return;
    if (startedFromScratch) {
      setPublishOpen(true);
      return;
    }
    void runPublish(false, '');
  };

  const runPublish = async (saveAsTemplate: boolean, templateName: string) => {
    setPublishOpen(false);
    setSaving(true);
    setMessage('');
    try {
      const planId = await publishMemberPlan();
      if (saveAsTemplate) {
        try {
          const created = await api<TrainingPlanTemplate>('/training-plan-templates', {
            method: 'POST',
            body: JSON.stringify({
              name: templateName,
              description: description || undefined,
              days: trainingDaysPayload(days),
            }),
          });
          await api(`/training-cards/${planId}`, {
            method: 'PATCH',
            body: JSON.stringify({ sourceTemplateId: created.id }),
          });
          setSourceTemplateId(created.id);
          setMessage('Published — now active for member. Also saved as a template.');
        } catch (err) {
          setMessage(
            `Published for the member, but saving the template failed: ${
              err instanceof Error ? err.message : 'unknown error'
            }. Use Save as template to retry.`,
          );
          return;
        }
      } else {
        setMessage('Published — now active for member');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  const saveAsTemplate = async (templateName: string) => {
    setSaveTemplateOpen(false);
    setSaving(true);
    setMessage('');
    try {
      const created = await api<TrainingPlanTemplate>('/training-plan-templates', {
        method: 'POST',
        body: JSON.stringify({
          name: templateName,
          description: description || undefined,
          days: trainingDaysPayload(days),
        }),
      });
      if (existingId) {
        await api(`/training-cards/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ sourceTemplateId: created.id }),
        });
        setSourceTemplateId(created.id);
      }
      setMessage('Saved as a training plan template');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save template');
    } finally {
      setSaving(false);
    }
  };

  const planPlaceholder = useMemo(
    () => defaultPlanName(memberName || 'Member'),
    [memberName],
  );

  const backLink = memberId ? `/members/${memberId}/training-card` : '/members';

  return (
    <div className="max-w-6xl">
      <Link to={backLink} className="text-sm text-brand-600 hover:underline">
        ← Back
      </Link>
      <h2 className="mt-3 text-2xl">Training Plan Builder</h2>
      <p className="text-sm text-ink-secondary">
        Status: <span className="font-medium text-ink">{status}</span>
        {memberName && <> · Member: {memberName}</>}
      </p>

      {isNew && !existingId && (
        <section className="page-panel mt-6">
          <h3 className="text-lg font-semibold text-ink">How do you want to start?</h3>
          <p className="mt-1 text-sm text-ink-secondary">
            Using a template is optional. You can still build the full week from scratch.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setPickerOpen(true)}>
              Use a template
            </Button>
            <p className="self-center text-sm text-ink-muted">or keep editing the empty week below</p>
          </div>
        </section>
      )}

      <section className="page-panel mt-6">
        <h3 className="text-lg font-semibold text-ink">Plan details</h3>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="form-label">Plan name</span>
            <input
              className="input-field !h-12"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={planPlaceholder}
            />
          </label>
          <label className="block">
            <span className="form-label">Review date</span>
            <input
              type="date"
              className="input-field !h-12"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
          </label>
          <label className="block lg:col-span-2">
            <span className="form-label">Description</span>
            <textarea
              className="input-field min-h-[6rem] resize-y py-3"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals, focus areas, coach notes for this training plan…"
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
        <Button variant="secondary" disabled={saving} onClick={saveDraft}>
          Save draft
        </Button>
        {status === 'DRAFT' && (
          <Button disabled={saving} onClick={handlePublishClick}>
            Publish
          </Button>
        )}
        <Button variant="ghost" disabled={saving} onClick={() => setSaveTemplateOpen(true)}>
          Save as template
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-ink-secondary">{message}</p>}

      <TrainingTemplatePicker
        open={pickerOpen}
        onSelect={applyTemplate}
        onCancel={() => setPickerOpen(false)}
      />
      <PublishWithTemplateDialog
        open={publishOpen}
        planKind="training"
        suggestedTemplateName={suggestTemplateName(name, memberName)}
        onConfirm={runPublish}
        onCancel={() => setPublishOpen(false)}
      />
      <SaveAsTemplateDialog
        open={saveTemplateOpen}
        suggestedName={suggestTemplateName(name, memberName)}
        onConfirm={saveAsTemplate}
        onCancel={() => setSaveTemplateOpen(false)}
      />
    </div>
  );
}

function defaultPlanName(member: string) {
  const month = new Date().toLocaleString('en-US', { month: 'long' });
  return `${month} Training Plan for ${member}`;
}
