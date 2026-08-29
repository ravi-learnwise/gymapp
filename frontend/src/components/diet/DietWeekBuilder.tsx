import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';
import CopyDayDialog from './CopyDayDialog';
import CopyMealDialog from './CopyMealDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import Button from '../ui/Button';
import {
  DAY_TYPE_LABELS,
  FOOD_UNITS,
  isNonVegetarianFood,
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  PREPARATION_OPTIONS,
  WEEKDAY_LABELS,
  mealDisplayLabel,
  type DietDayType,
  type MealType,
} from '../../types/diet-plan';
import {
  copyDietDayLocal,
  copyDietMealLocal,
  type DietAltDraft,
  type DietDayDraft,
  type DietFoodDraft,
  type DietMealDraft,
} from './diet-week';

type DietWeekBuilderProps = {
  days: DietDayDraft[];
  onDaysChange: Dispatch<SetStateAction<DietDayDraft[]>>;
  activeTab: number;
  onActiveTabChange: (weekday: number) => void;
  isVegetarian?: boolean;
  dietTypeLabel?: string;
  onFoodWarning?: (message: string) => void;
  onCopyDayRemote?: (targetWeekdays: number[], replaceExisting: boolean) => Promise<void> | void;
  onCopyMealRemote?: (
    meal: DietMealDraft,
    targetWeekdays: number[],
    replaceExisting: boolean,
  ) => Promise<void> | void;
};

export default function DietWeekBuilder({
  days,
  onDaysChange,
  activeTab,
  onActiveTabChange,
  isVegetarian,
  dietTypeLabel,
  onFoodWarning,
  onCopyDayRemote,
  onCopyMealRemote,
}: DietWeekBuilderProps) {
  const [copyDayOpen, setCopyDayOpen] = useState(false);
  const [copyMealTarget, setCopyMealTarget] = useState<{ index: number; label: string } | null>(null);
  const [removeMealTarget, setRemoveMealTarget] = useState<number | null>(null);
  const currentDay = days[activeTab];

  const dayTypes = useMemo(
    () => Object.entries(DAY_TYPE_LABELS) as [DietDayType, string][],
    [],
  );

  const handleCopyDay = async (targetWeekdays: number[], replaceExisting: boolean) => {
    setCopyDayOpen(false);
    if (onCopyDayRemote) {
      await onCopyDayRemote(targetWeekdays, replaceExisting);
      return;
    }
    onDaysChange((prev) => copyDietDayLocal(prev, activeTab, targetWeekdays, replaceExisting));
  };

  const handleCopyMeal = async (targetWeekdays: number[], replaceExisting: boolean) => {
    if (!copyMealTarget) return;
    const meal = currentDay.meals[copyMealTarget.index];
    const mealIndex = copyMealTarget.index;
    setCopyMealTarget(null);
    if (onCopyMealRemote) {
      await onCopyMealRemote(meal, targetWeekdays, replaceExisting);
      return;
    }
    onDaysChange((prev) =>
      copyDietMealLocal(prev, activeTab, mealIndex, targetWeekdays, replaceExisting),
    );
  };

  const addMeal = (mealType: MealType) => {
    onDaysChange((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? { ...d, meals: [...d.meals, { mealType, foods: [] }] }
          : d,
      ),
    );
  };

  const removeMeal = (index: number) => {
    onDaysChange((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? { ...d, meals: d.meals.filter((_, i) => i !== index) }
          : d,
      ),
    );
    setRemoveMealTarget(null);
  };

  const moveMeal = (index: number, dir: -1 | 1) => {
    onDaysChange((prev) =>
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

  const updateMeal = (index: number, patch: Partial<DietMealDraft>) => {
    onDaysChange((prev) =>
      prev.map((d) =>
        d.weekday === activeTab
          ? { ...d, meals: d.meals.map((m, i) => (i === index ? { ...m, ...patch } : m)) }
          : d,
      ),
    );
  };

  const addFood = (mealIndex: number) => {
    onDaysChange((prev) =>
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

  const updateFood = (mealIndex: number, foodIndex: number, patch: Partial<DietFoodDraft>) => {
    if (patch.foodName && isVegetarian && isNonVegetarianFood(patch.foodName)) {
      onFoodWarning?.(
        `Member is marked ${dietTypeLabel}. "${patch.foodName}" may be non-vegetarian — please verify.`,
      );
    }
    onDaysChange((prev) =>
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
    onDaysChange((prev) =>
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
    onDaysChange((prev) =>
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
                              alternatives: [...f.alternatives, { alternativeFoodName: '' }],
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
    patch: Partial<DietAltDraft>,
  ) => {
    onDaysChange((prev) =>
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

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium ${activeTab === i ? 'bg-brand-600 text-white' : 'bg-neutral-soft text-ink-secondary'}`}
            onClick={() => onActiveTabChange(i)}
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
                  onDaysChange((prev) =>
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
    </>
  );
}
