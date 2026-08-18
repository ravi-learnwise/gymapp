import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';
import CopyDayDialog from '../../components/diet/CopyDayDialog';
import CopyMealDialog from '../../components/diet/CopyMealDialog';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { api } from '../../lib/api';
import type { Member } from '../../types/member';
import {
  DAY_TYPE_LABELS,
  FOOD_UNITS,
  isNonVegetarianFood,
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  OBJECTIVE_LABELS,
  PREPARATION_OPTIONS,
  WEEKDAY_LABELS,
  mealDisplayLabel,
  type DietDayType,
  type DietPlan,
  type DietPlanObjective,
  type MealType,
} from '../../types/diet-plan';

type AltDraft = {
  alternativeFoodName: string;
  quantity?: string;
  unit?: string;
  notes?: string;
};

type FoodDraft = {
  id?: string;
  foodName: string;
  quantity?: string;
  unit?: string;
  preparation?: string;
  notes?: string;
  alternatives: AltDraft[];
};

type MealDraft = {
  id?: string;
  mealType: MealType;
  title?: string;
  approximateTime?: string;
  timingNote?: string;
  notes?: string;
  foods: FoodDraft[];
};

type DayDraft = {
  weekday: number;
  dayType: DietDayType;
  notes?: string;
  meals: MealDraft[];
};

function emptyDays(): DayDraft[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    dayType: 'PLAN_AVAILABLE' as DietDayType,
    meals: [],
  }));
}

function planToDays(plan: DietPlan): DayDraft[] {
  const base = emptyDays();
  for (const day of plan.days) {
    base[day.weekday] = {
      weekday: day.weekday,
      dayType: day.dayType,
      notes: day.notes ?? undefined,
      meals: (day.meals ?? []).map((m) => ({
        id: m.id,
        mealType: m.mealType,
        title: m.title ?? undefined,
        approximateTime: m.approximateTime ?? undefined,
        timingNote: m.timingNote ?? undefined,
        notes: m.notes ?? undefined,
        foods: (m.foods ?? []).map((f) => ({
          id: f.id,
          foodName: f.foodName,
          quantity: f.quantity ?? undefined,
          unit: f.unit ?? undefined,
          preparation: f.preparation ?? undefined,
          notes: f.notes ?? undefined,
          alternatives: (f.alternatives ?? []).map((a) => ({
            alternativeFoodName: a.alternativeFoodName,
            quantity: a.quantity ?? undefined,
            unit: a.unit ?? undefined,
            notes: a.notes ?? undefined,
          })),
        })),
      })),
    };
  }
  return base;
}

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
  const [days, setDays] = useState<DayDraft[]>(emptyDays());
  const [activeTab, setActiveTab] = useState(new Date().getDay());
  const [member, setMember] = useState<Member | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus] = useState('DRAFT');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [copyDayOpen, setCopyDayOpen] = useState(false);
  const [copyMealTarget, setCopyMealTarget] = useState<{ index: number; label: string } | null>(null);
  const [removeMealTarget, setRemoveMealTarget] = useState<number | null>(null);
  const [foodWarning, setFoodWarning] = useState('');

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
      setDays(planToDays(plan));
      setStatus(plan.status);
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

  const currentDay = days[activeTab];
  const isVegetarian = member?.dietType?.toLowerCase().includes('vegetarian');

  const buildPayload = () => ({
    name,
    objective,
    description: description || undefined,
    hydrationGoal: hydrationGoal || undefined,
    effectiveFrom: effectiveFrom || undefined,
    reviewDate: reviewDate || undefined,
    days: days.map((d) => ({
      weekday: d.weekday,
      dayType: d.dayType,
      notes: d.notes,
      displayOrder: d.weekday,
      meals: d.meals.map((meal, mi) => ({
        mealType: meal.mealType,
        title: meal.title,
        approximateTime: meal.approximateTime,
        timingNote: meal.timingNote,
        notes: meal.notes,
        displayOrder: mi,
        foods: meal.foods.map((food, fi) => ({
          foodName: food.foodName,
          quantity: food.quantity,
          unit: food.unit,
          preparation: food.preparation,
          notes: food.notes,
          displayOrder: fi,
          alternatives: food.alternatives.map((alt, ai) => ({
            alternativeFoodName: alt.alternativeFoodName,
            quantity: alt.quantity,
            unit: alt.unit,
            notes: alt.notes,
            displayOrder: ai,
          })),
        })),
      })),
    })),
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

  const publish = async () => {
    setSaving(true);
    setMessage('');
    try {
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
      if (!id) return;
      await api(`/diet-plans/${id}/publish`, { method: 'POST', body: '{}' });
      setStatus('ACTIVE');
      setMessage('Published — now active for member');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyDay = async (targetWeekdays: number[], replaceExisting: boolean) => {
    setCopyDayOpen(false);
    if (!existingId) {
      await saveDraft();
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
      setDays(planToDays(updated));
      setMessage(`Copied ${WEEKDAY_LABELS[activeTab]} to selected days`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Copy failed');
    }
  };

  const handleCopyMeal = async (targetWeekdays: number[], replaceExisting: boolean) => {
    if (!copyMealTarget) return;
    const meal = currentDay.meals[copyMealTarget.index];
    setCopyMealTarget(null);
    if (!meal.id) {
      setMessage('Save draft first before copying meals');
      return;
    }
    try {
      const updated = await api<DietPlan>(`/diet-plan-meals/${meal.id}/copy`, {
        method: 'POST',
        body: JSON.stringify({ targetWeekdays, replaceExisting }),
      });
      setDays(planToDays(updated));
      setMessage('Meal copied to selected days');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Copy meal failed');
    }
  };

  const addMeal = (mealType: MealType) => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? {
              ...d,
              meals: [
                ...d.meals,
                { mealType, foods: [] },
              ],
            }
          : d,
      ),
    );
  };

  const removeMeal = (index: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? { ...d, meals: d.meals.filter((_, i) => i !== index) }
          : d,
      ),
    );
    setRemoveMealTarget(null);
  };

  const moveMeal = (index: number, dir: -1 | 1) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== activeTab) return d;
        const next = [...d.meals];
        const target = index + dir;
        if (target < 0 || target >= next.length) return d;
        [next[index], next[target]] = [next[target], next[index]];
        return { ...d, meals: next };
      }),
    );
  };

  const updateMeal = (index: number, patch: Partial<MealDraft>) => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? {
              ...d,
              meals: d.meals.map((m, i) => (i === index ? { ...m, ...patch } : m)),
            }
          : d,
      ),
    );
  };

  const addFood = (mealIndex: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? {
              ...d,
              meals: d.meals.map((m, i) =>
                i === mealIndex
                  ? { ...m, foods: [...m.foods, { foodName: '', alternatives: [] }] }
                  : m,
              ),
            }
          : d,
      ),
    );
  };

  const updateFood = (mealIndex: number, foodIndex: number, patch: Partial<FoodDraft>) => {
    if (patch.foodName && isVegetarian && isNonVegetarianFood(patch.foodName)) {
      setFoodWarning(
        `Member is marked ${member?.dietType}. "${patch.foodName}" may be non-vegetarian — please verify.`,
      );
    }
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? {
              ...d,
              meals: d.meals.map((m, mi) =>
                mi === mealIndex
                  ? {
                      ...m,
                      foods: m.foods.map((f, fi) =>
                        fi === foodIndex ? { ...f, ...patch } : f,
                      ),
                    }
                  : m,
              ),
            }
          : d,
      ),
    );
  };

  const removeFood = (mealIndex: number, foodIndex: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? {
              ...d,
              meals: d.meals.map((m, mi) =>
                mi === mealIndex
                  ? { ...m, foods: m.foods.filter((_, fi) => fi !== foodIndex) }
                  : m,
              ),
            }
          : d,
      ),
    );
  };

  const addAlternative = (mealIndex: number, foodIndex: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? {
              ...d,
              meals: d.meals.map((m, mi) =>
                mi === mealIndex
                  ? {
                      ...m,
                      foods: m.foods.map((f, fi) =>
                        fi === foodIndex
                          ? {
                              ...f,
                              alternatives: [
                                ...f.alternatives,
                                { alternativeFoodName: '' },
                              ],
                            }
                          : f,
                      ),
                    }
                  : m,
              ),
            }
          : d,
      ),
    );
  };

  const updateAlternative = (
    mealIndex: number,
    foodIndex: number,
    altIndex: number,
    patch: Partial<AltDraft>,
  ) => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? {
              ...d,
              meals: d.meals.map((m, mi) =>
                mi === mealIndex
                  ? {
                      ...m,
                      foods: m.foods.map((f, fi) =>
                        fi === foodIndex
                          ? {
                              ...f,
                              alternatives: f.alternatives.map((a, ai) =>
                                ai === altIndex ? { ...a, ...patch } : a,
                              ),
                            }
                          : f,
                      ),
                    }
                  : m,
              ),
            }
          : d,
      ),
    );
  };

  const backLink = memberId ? `/members/${memberId}/diet-plan` : '/members';

  const dayTypes = useMemo(
    () => Object.entries(DAY_TYPE_LABELS) as [DietDayType, string][],
    [],
  );

  return (
    <div className="max-w-6xl">
      <Link to={backLink} className="text-sm text-brand-600 hover:underline">← Back</Link>
      <h2 className="mt-3 text-2xl">Diet Plan Builder</h2>
      <p className="text-sm text-ink-secondary">Status: {status}</p>

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

      <div className="mt-6 flex flex-wrap gap-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium ${activeTab === i ? 'bg-brand-600 text-white' : 'bg-neutral-soft text-ink-secondary'}`}
            onClick={() => setActiveTab(i)}
          >
            {label}
            {days[i].meals.length > 0 && <span className="ml-1 opacity-75">({days[i].meals.length})</span>}
          </button>
        ))}
      </div>

      <section className="page-panel mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-ink">{WEEKDAY_LABELS[activeTab]}</h3>
          <Button variant="secondary" onClick={() => setCopyDayOpen(true)}>
            <Copy className="h-4 w-4" />
            Copy {WEEKDAY_LABELS[activeTab]} to other days
          </Button>
        </div>

        <div className="mt-3">
          <span className="form-label">Day type</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {dayTypes.map(([type, label]) => (
              <button
                key={type}
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm ${currentDay.dayType === type ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line'}`}
                onClick={() =>
                  setDays((prev) =>
                    prev.map((d) => (d.weekday === activeTab ? { ...d, dayType: type } : d)),
                  )
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {currentDay.dayType === 'NO_SPECIFIC_PLAN' ? (
          <p className="mt-6 rounded-lg border border-dashed border-line py-8 text-center text-sm text-ink-muted">
            No specific plan for this day — the member will see a clear rest-day message.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {currentDay.meals.map((meal, mealIndex) => (
              <div key={mealIndex} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-ink-muted">Meal / intake</span>
                      <select
                        className="select-field mt-1 w-full"
                        value={meal.mealType}
                        onChange={(e) => updateMeal(mealIndex, { mealType: e.target.value as MealType })}
                      >
                        {MEAL_TYPES.map((t) => (
                          <option key={t} value={t}>{MEAL_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-ink-muted">Custom label (optional)</span>
                      <input className="input-field mt-1 w-full" value={meal.title ?? ''} onChange={(e) => updateMeal(mealIndex, { title: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-ink-muted">Approx. time</span>
                      <input className="input-field mt-1 w-full" placeholder="~8:00 AM" value={meal.approximateTime ?? ''} onChange={(e) => updateMeal(mealIndex, { approximateTime: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-ink-muted">Timing note</span>
                      <input className="input-field mt-1 w-full" placeholder="30–60 min before workout" value={meal.timingNote ?? ''} onChange={(e) => updateMeal(mealIndex, { timingNote: e.target.value })} />
                    </label>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className="rounded p-1 hover:bg-canvas" onClick={() => moveMeal(mealIndex, -1)} aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
                    <button type="button" className="rounded p-1 hover:bg-canvas" onClick={() => moveMeal(mealIndex, 1)} aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
                    <button type="button" className="rounded p-1 text-brand-600 hover:bg-brand-50" onClick={() => setCopyMealTarget({ index: mealIndex, label: mealDisplayLabel(meal) })} aria-label="Copy meal"><Copy className="h-4 w-4" /></button>
                    <button type="button" className="rounded p-1 text-danger hover:bg-danger-soft" onClick={() => setRemoveMealTarget(mealIndex)} aria-label="Remove meal"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {meal.foods.map((food, foodIndex) => (
                    <div key={foodIndex} className="rounded-md bg-canvas p-3">
                      <div className="grid gap-2 sm:grid-cols-4">
                        <input className="input-field sm:col-span-2" placeholder="Food name" value={food.foodName} onChange={(e) => updateFood(mealIndex, foodIndex, { foodName: e.target.value })} />
                        <input className="input-field" placeholder="Qty" value={food.quantity ?? ''} onChange={(e) => updateFood(mealIndex, foodIndex, { quantity: e.target.value })} />
                        <select className="select-field" value={food.unit ?? ''} onChange={(e) => updateFood(mealIndex, foodIndex, { unit: e.target.value })}>
                          <option value="">Unit</option>
                          {FOOD_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <select className="select-field sm:col-span-2" value={food.preparation ?? ''} onChange={(e) => updateFood(mealIndex, foodIndex, { preparation: e.target.value })}>
                          <option value="">Preparation</option>
                          {PREPARATION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input className="input-field sm:col-span-2" placeholder="Notes" value={food.notes ?? ''} onChange={(e) => updateFood(mealIndex, foodIndex, { notes: e.target.value })} />
                      </div>
                      {food.alternatives.map((alt, altIndex) => (
                        <div key={altIndex} className="mt-2 grid gap-2 border-l-2 border-brand-200 pl-3 sm:grid-cols-3">
                          <input className="input-field" placeholder="Alternative food" value={alt.alternativeFoodName} onChange={(e) => updateAlternative(mealIndex, foodIndex, altIndex, { alternativeFoodName: e.target.value })} />
                          <input className="input-field" placeholder="Qty" value={alt.quantity ?? ''} onChange={(e) => updateAlternative(mealIndex, foodIndex, altIndex, { quantity: e.target.value })} />
                          <input className="input-field" placeholder="Unit" value={alt.unit ?? ''} onChange={(e) => updateAlternative(mealIndex, foodIndex, altIndex, { unit: e.target.value })} />
                        </div>
                      ))}
                      <div className="mt-2 flex gap-3">
                        <button type="button" className="text-xs text-brand-600 hover:underline" onClick={() => addAlternative(mealIndex, foodIndex)}>+ Alternative</button>
                        <button type="button" className="text-xs text-danger hover:underline" onClick={() => removeFood(mealIndex, foodIndex)}>Remove food</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="flex items-center gap-1 text-sm text-brand-600 hover:underline" onClick={() => addFood(mealIndex)}>
                    <Plus className="h-4 w-4" /> Add food
                  </button>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.slice(0, 6).map((t) => (
                <button key={t} type="button" className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-canvas" onClick={() => addMeal(t)}>
                  + {MEAL_TYPE_LABELS[t]}
                </button>
              ))}
              <button type="button" className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-canvas" onClick={() => addMeal('OTHER')}>
                + Other intake
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" disabled={saving} onClick={saveDraft}>Save draft</Button>
        {status === 'DRAFT' && (
          <Button disabled={saving} onClick={publish}>Publish</Button>
        )}
      </div>
      {message && <p className="mt-3 text-sm text-ink-secondary">{message}</p>}

      <CopyDayDialog
        open={copyDayOpen}
        sourceWeekday={activeTab}
        onConfirm={handleCopyDay}
        onCancel={() => setCopyDayOpen(false)}
      />
      <CopyMealDialog
        open={!!copyMealTarget}
        mealLabel={copyMealTarget?.label ?? ''}
        sourceWeekday={activeTab}
        onConfirm={handleCopyMeal}
        onCancel={() => setCopyMealTarget(null)}
      />
      <ConfirmDialog
        open={removeMealTarget !== null}
        title="Remove meal?"
        message="Remove this intake occasion and all its food items?"
        confirmLabel="Remove"
        onConfirm={() => removeMealTarget !== null && removeMeal(removeMealTarget)}
        onCancel={() => setRemoveMealTarget(null)}
      />
    </div>
  );
}
