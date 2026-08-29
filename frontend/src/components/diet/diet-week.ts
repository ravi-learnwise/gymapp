import type { DietDayType, DietPlanMeal, MealType } from '../../types/diet-plan';

export type DietAltDraft = {
  alternativeFoodName: string;
  quantity?: string;
  unit?: string;
  notes?: string;
};

export type DietFoodDraft = {
  id?: string;
  foodName: string;
  quantity?: string;
  unit?: string;
  preparation?: string;
  notes?: string;
  alternatives: DietAltDraft[];
};

export type DietMealDraft = {
  id?: string;
  mealType: MealType;
  title?: string;
  approximateTime?: string;
  timingNote?: string;
  notes?: string;
  foods: DietFoodDraft[];
};

export type DietDayDraft = {
  weekday: number;
  dayType: DietDayType;
  notes?: string;
  meals: DietMealDraft[];
};

export function emptyDietDays(): DietDayDraft[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    dayType: 'PLAN_AVAILABLE' as const,
    meals: [],
  }));
}

export function dietDaysFromPlan(plan: {
  days: {
    weekday: number;
    dayType: DietDayType;
    notes?: string | null;
    meals?: DietPlanMeal[];
  }[];
}): DietDayDraft[] {
  const base = emptyDietDays();
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

export function dietDaysPayload(days: DietDayDraft[]) {
  return days.map((d) => ({
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
  }));
}

function cloneMeals(meals: DietMealDraft[]): DietMealDraft[] {
  return meals.map((m) => ({
    ...m,
    id: undefined,
    foods: m.foods.map((f) => ({
      ...f,
      id: undefined,
      alternatives: f.alternatives.map((a) => ({ ...a })),
    })),
  }));
}

export function copyDietDayLocal(
  days: DietDayDraft[],
  sourceWeekday: number,
  targetWeekdays: number[],
  replaceExisting: boolean,
): DietDayDraft[] {
  const source = days[sourceWeekday];
  return days.map((d) => {
    if (!targetWeekdays.includes(d.weekday) || d.weekday === sourceWeekday) return d;
    if (d.meals.length > 0 && !replaceExisting) return d;
    return {
      ...d,
      dayType: source.dayType,
      notes: source.notes,
      meals: cloneMeals(source.meals),
    };
  });
}

export function copyDietMealLocal(
  days: DietDayDraft[],
  sourceWeekday: number,
  mealIndex: number,
  targetWeekdays: number[],
  replaceExisting: boolean,
): DietDayDraft[] {
  const meal = days[sourceWeekday]?.meals[mealIndex];
  if (!meal) return days;
  const cloned: DietMealDraft = {
    ...meal,
    id: undefined,
    foods: meal.foods.map((f) => ({
      ...f,
      id: undefined,
      alternatives: f.alternatives.map((a) => ({ ...a })),
    })),
  };
  return days.map((d) => {
    if (!targetWeekdays.includes(d.weekday) || d.weekday === sourceWeekday) return d;
    let meals = [...d.meals];
    if (replaceExisting) {
      meals = meals.filter((m) => m.mealType !== meal.mealType);
    }
    return { ...d, meals: [...meals, cloned] };
  });
}
