import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import DietWeekBuilder from '../../components/diet/DietWeekBuilder';
import DietTemplatePicker from '../../components/diet/DietTemplatePicker';
import {
  dietDaysFromPlan,
  dietDaysPayload,
  emptyDietDays,
  type DietMealDraft,
} from '../../components/diet/diet-week';
import Button from '../../components/ui/Button';
import PublishWithTemplateDialog from '../../components/ui/PublishWithTemplateDialog';
import SaveAsTemplateDialog from '../../components/ui/SaveAsTemplateDialog';
import { api } from '../../lib/api';
import { suggestTemplateName } from '../../lib/plan-templates';
import type { Member } from '../../types/member';
import {
  OBJECTIVE_LABELS,
  WEEKDAY_LABELS,
  type DietPlan,
  type DietPlanObjective,
  type DietPlanTemplate,
} from '../../types/diet-plan';

export default function DietPlanEditorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname.includes('/diet-plan/new');
  const memberId = isNew ? id : undefined;
  const planId = isNew ? undefined : id;

  const [name, setName] = useState('');
  const [objective, setObjective] = useState<DietPlanObjective>('GENERAL_FITNESS');
  const [description, setDescription] = useState('');
  const [hydrationGoal, setHydrationGoal] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [days, setDays] = useState(emptyDietDays());
  const [activeTab, setActiveTab] = useState(new Date().getDay());
  const [member, setMember] = useState<Member | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus] = useState('DRAFT');
  const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(null);
  const [previousVersionId, setPreviousVersionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [foodWarning, setFoodWarning] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  useEffect(() => {
    const mid = memberId ?? member?.id;
    if (!mid) return;
    api<Member>(`/members/${mid}`).then((m) => {
      setMember(m);
      if (isNew && !name) {
        const month = new Date().toLocaleString('en-US', { month: 'long' });
        setName(`${month} Diet Plan for ${m.fullName}`);
      }
    });
  }, [memberId, isNew, member?.id, name]);

  useEffect(() => {
    if (isNew || !planId) return;
    api<DietPlan>(`/diet-plans/${planId}`).then((plan) => {
      setExistingId(plan.id);
      setName(plan.name);
      setObjective(plan.objective);
      setDescription(plan.description ?? '');
      setHydrationGoal(plan.hydrationGoal ?? '');
      setReviewDate(plan.reviewDate ? plan.reviewDate.slice(0, 10) : '');
      setEffectiveFrom(plan.effectiveFrom ? plan.effectiveFrom.slice(0, 10) : '');
      setDays(dietDaysFromPlan(plan));
      setStatus(plan.status);
      setSourceTemplateId(plan.sourceTemplateId ?? null);
      setPreviousVersionId(plan.previousVersionId);
      if (plan.member) {
        setMember({
          id: plan.member.id,
          fullName: plan.member.fullName,
          memberNumber: plan.member.memberNumber,
          dietType: plan.member.dietType ?? undefined,
          allergies: plan.member.allergies ?? undefined,
          medicalHistory: plan.member.medicalHistory ?? undefined,
        } as Member);
      }
    });
  }, [planId, isNew]);

  const startedFromScratch = !sourceTemplateId && !previousVersionId;
  const weekHasContent = days.some((d) => d.meals.length > 0);
  const isVegetarian = member?.dietType?.toLowerCase().includes('vegetarian');

  const applyTemplate = (tpl: DietPlanTemplate) => {
    if (weekHasContent && !window.confirm('Replace the current week with this template?')) {
      return;
    }
    setDays(dietDaysFromPlan(tpl));
    setSourceTemplateId(tpl.id);
    setObjective(tpl.objective);
    setDescription(tpl.description ?? '');
    setHydrationGoal(tpl.hydrationGoal ?? '');
    if (member?.fullName) {
      setName(`${tpl.name} for ${member.fullName}`);
    } else {
      setName(tpl.name);
    }
    setPickerOpen(false);
  };

  const buildPayload = () => ({
    name,
    objective,
    description: description || undefined,
    hydrationGoal: hydrationGoal || undefined,
    effectiveFrom: effectiveFrom || undefined,
    reviewDate: reviewDate || undefined,
    sourceTemplateId: sourceTemplateId || undefined,
    days: dietDaysPayload(days),
  });

  const saveDraft = async () => {
    setSaving(true);
    setMessage('');
    try {
      if (existingId) {
        await api(`/diet-plans/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify(buildPayload()),
        });
        setMessage('Draft saved');
      } else if (memberId) {
        const created = await api<DietPlan>('/diet-plans', {
          method: 'POST',
          body: JSON.stringify({ memberId, ...buildPayload() }),
        });
        setExistingId(created.id);
        setMessage('Draft created');
        navigate(`/diet-plans/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const publishMemberPlan = async () => {
    let id = existingId;
    if (!id && memberId) {
      const created = await api<DietPlan>('/diet-plans', {
        method: 'POST',
        body: JSON.stringify({ memberId, ...buildPayload() }),
      });
      id = created.id;
      setExistingId(created.id);
      navigate(`/diet-plans/${created.id}/edit`, { replace: true });
    } else if (id) {
      await api(`/diet-plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(buildPayload()),
      });
    }
    if (!id) throw new Error('Could not save plan');
    await api(`/diet-plans/${id}/publish`, { method: 'POST', body: '{}' });
    setStatus('ACTIVE');
    return id;
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
      const id = await publishMemberPlan();
      if (saveAsTemplate) {
        try {
          const created = await api<DietPlanTemplate>('/diet-plan-templates', {
            method: 'POST',
            body: JSON.stringify({
              name: templateName,
              objective,
              description: description || undefined,
              hydrationGoal: hydrationGoal || undefined,
              days: dietDaysPayload(days),
            }),
          });
          await api(`/diet-plans/${id}`, {
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
      const created = await api<DietPlanTemplate>('/diet-plan-templates', {
        method: 'POST',
        body: JSON.stringify({
          name: templateName,
          objective,
          description: description || undefined,
          hydrationGoal: hydrationGoal || undefined,
          days: dietDaysPayload(days),
        }),
      });
      if (existingId) {
        await api(`/diet-plans/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ sourceTemplateId: created.id }),
        });
        setSourceTemplateId(created.id);
      }
      setMessage('Saved as a diet plan template');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save template');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyDay = async (targetWeekdays: number[], replaceExisting: boolean) => {
    if (!existingId) {
      await saveDraft();
      setMessage('Save draft first, then copy the day again');
      return;
    }
    try {
      const updated = await api<DietPlan>(
        `/diet-plans/${existingId}/days/${activeTab}/copy`,
        {
          method: 'POST',
          body: JSON.stringify({ targetWeekdays, replaceExisting }),
        },
      );
      setDays(dietDaysFromPlan(updated));
      setMessage(`Copied ${WEEKDAY_LABELS[activeTab]} to selected days`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Copy failed');
    }
  };

  const handleCopyMeal = async (
    meal: DietMealDraft,
    targetWeekdays: number[],
    replaceExisting: boolean,
  ) => {
    if (!meal.id) {
      setMessage('Save draft first before copying meals');
      return;
    }
    try {
      const updated = await api<DietPlan>(`/diet-plan-meals/${meal.id}/copy`, {
        method: 'POST',
        body: JSON.stringify({ targetWeekdays, replaceExisting }),
      });
      setDays(dietDaysFromPlan(updated));
      setMessage('Meal copied to selected days');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Copy meal failed');
    }
  };

  const backLink = memberId ? `/members/${memberId}/diet-plan` : '/members';

  return (
    <div className="max-w-6xl">
      <Link to={backLink} className="text-sm text-brand-600 hover:underline">← Back</Link>
      <h2 className="mt-3 text-2xl">Diet Plan Builder</h2>
      <p className="text-sm text-ink-secondary">Status: {status}</p>

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

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <section className="page-panel lg:col-span-2">
          <h3 className="text-lg font-semibold text-ink">Plan details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="form-label">Plan name</span>
              <input className="input-field !h-12 w-full" value={name} onChange={(e) => setName(e.target.value)} />
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
            <label className="block">
              <span className="form-label">Review date</span>
              <input type="date" className="input-field !h-12 w-full" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="form-label">General instructions</span>
              <textarea className="input-field min-h-[5rem] w-full py-3" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Drink adequate water, prefer freshly prepared meals…" />
            </label>
            <label className="block sm:col-span-2">
              <span className="form-label">Daily hydration goal</span>
              <input className="input-field !h-12 w-full" value={hydrationGoal} onChange={(e) => setHydrationGoal(e.target.value)} placeholder="e.g. 2.5 litres/day" />
            </label>
          </div>
        </section>

        <aside className="page-panel h-fit">
          <h3 className="font-semibold text-ink">Member considerations</h3>
          {member ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="text-ink-muted">Diet type</dt><dd>{member.dietType || '—'}</dd></div>
              <div><dt className="text-ink-muted">Allergies</dt><dd>{member.allergies || '—'}</dd></div>
              <div><dt className="text-ink-muted">Medical notes</dt><dd className="whitespace-pre-wrap">{member.medicalHistory || '—'}</dd></div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">Loading member info…</p>
          )}
          {foodWarning && (
            <p className="mt-3 rounded-lg border border-warning-border bg-warning-soft p-3 text-xs text-warning">
              {foodWarning}
            </p>
          )}
        </aside>
      </div>

      <DietWeekBuilder
        days={days}
        onDaysChange={setDays}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        isVegetarian={isVegetarian}
        dietTypeLabel={member?.dietType}
        onFoodWarning={setFoodWarning}
        onCopyDayRemote={handleCopyDay}
        onCopyMealRemote={handleCopyMeal}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" disabled={saving} onClick={saveDraft}>Save draft</Button>
        {status === 'DRAFT' && (
          <Button disabled={saving} onClick={handlePublishClick}>Publish</Button>
        )}
        <Button variant="ghost" disabled={saving} onClick={() => setSaveTemplateOpen(true)}>
          Save as template
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-ink-secondary">{message}</p>}

      <DietTemplatePicker
        open={pickerOpen}
        onSelect={applyTemplate}
        onCancel={() => setPickerOpen(false)}
      />
      <PublishWithTemplateDialog
        open={publishOpen}
        planKind="diet"
        suggestedTemplateName={suggestTemplateName(name, member?.fullName)}
        onConfirm={runPublish}
        onCancel={() => setPublishOpen(false)}
      />
      <SaveAsTemplateDialog
        open={saveTemplateOpen}
        suggestedName={suggestTemplateName(name, member?.fullName)}
        onConfirm={saveAsTemplate}
        onCancel={() => setSaveTemplateOpen(false)}
      />
    </div>
  );
}
