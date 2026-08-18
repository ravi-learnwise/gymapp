export type DietPlanStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';

export type DietPlanObjective =
  | 'GENERAL_FITNESS'
  | 'WEIGHT_MANAGEMENT'
  | 'FAT_LOSS'
  | 'MUSCLE_GAIN'
  | 'STRENGTH_PERFORMANCE'
  | 'HEALTHY_EATING'
  | 'SPORTS_ATHLETIC'
  | 'MEDICAL_SPECIAL'
  | 'OTHER';

export type DietDayType = 'PLAN_AVAILABLE' | 'REST_RECOVERY' | 'NO_SPECIFIC_PLAN';

export type MealType =
  | 'EARLY_MORNING'
  | 'BREAKFAST'
  | 'MID_MORNING'
  | 'LUNCH'
  | 'EVENING_HIGH_TEA'
  | 'PRE_WORKOUT'
  | 'POST_WORKOUT'
  | 'DINNER'
  | 'BEDTIME'
  | 'SUPPLEMENT'
  | 'HYDRATION'
  | 'OTHER';

export type DietFoodAlternative = {
  id?: string;
  alternativeFoodName: string;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
  displayOrder?: number;
};

export type DietPlanFoodItem = {
  id?: string;
  foodName: string;
  quantity?: string | null;
  unit?: string | null;
  preparation?: string | null;
  notes?: string | null;
  displayOrder?: number;
  alternatives?: DietFoodAlternative[];
};

export type DietPlanMeal = {
  id?: string;
  mealType: MealType;
  title?: string | null;
  approximateTime?: string | null;
  timingNote?: string | null;
  notes?: string | null;
  displayOrder?: number;
  foods?: DietPlanFoodItem[];
};

export type DietPlanDay = {
  id?: string;
  weekday: number;
  dayType: DietDayType;
  notes?: string | null;
  displayOrder?: number;
  meals?: DietPlanMeal[];
};

export type DietPlan = {
  id: string;
  memberId: string;
  name: string;
  objective: DietPlanObjective;
  description: string | null;
  hydrationGoal: string | null;
  status: DietPlanStatus;
  version: number;
  effectiveFrom: string | null;
  reviewDate: string | null;
  previousVersionId: string | null;
  days: DietPlanDay[];
  member?: {
    id: string;
    memberNumber: string;
    fullName: string;
    dietType?: string | null;
    allergies?: string | null;
    medicalHistory?: string | null;
  };
  createdBy?: { firstName: string | null; lastName: string | null; role?: string };
};

export { WEEKDAY_LABELS } from './training-card';

export const OBJECTIVE_LABELS: Record<DietPlanObjective, string> = {
  GENERAL_FITNESS: 'General Fitness',
  WEIGHT_MANAGEMENT: 'Weight Management',
  FAT_LOSS: 'Fat Loss',
  MUSCLE_GAIN: 'Muscle Gain',
  STRENGTH_PERFORMANCE: 'Strength / Performance',
  HEALTHY_EATING: 'Healthy Eating',
  SPORTS_ATHLETIC: 'Sports / Athletic Performance',
  MEDICAL_SPECIAL: 'Medical / Special Diet',
  OTHER: 'Other',
};

export const DAY_TYPE_LABELS: Record<DietDayType, string> = {
  PLAN_AVAILABLE: 'Plan available',
  REST_RECOVERY: 'Rest / recovery',
  NO_SPECIFIC_PLAN: 'No specific plan',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  EARLY_MORNING: 'Early Morning',
  BREAKFAST: 'Breakfast',
  MID_MORNING: 'Mid-Morning',
  LUNCH: 'Lunch',
  EVENING_HIGH_TEA: 'Evening / High Tea',
  PRE_WORKOUT: 'Pre-Workout',
  POST_WORKOUT: 'Post-Workout',
  DINNER: 'Dinner',
  BEDTIME: 'Bedtime',
  SUPPLEMENT: 'Supplement',
  HYDRATION: 'Hydration',
  OTHER: 'Other',
};

export const MEAL_TYPES: MealType[] = [
  'EARLY_MORNING',
  'BREAKFAST',
  'MID_MORNING',
  'LUNCH',
  'EVENING_HIGH_TEA',
  'PRE_WORKOUT',
  'POST_WORKOUT',
  'DINNER',
  'BEDTIME',
  'SUPPLEMENT',
  'HYDRATION',
  'OTHER',
];

export const FOOD_UNITS = [
  'g',
  'kg',
  'ml',
  'litre',
  'cup',
  'glass',
  'bowl',
  'piece',
  'serving',
  'slice',
  'egg',
  'roti',
  'medium',
  'large',
  'teaspoon',
  'tablespoon',
  'handful',
] as const;

export const PREPARATION_OPTIONS = [
  'Cooked',
  'Raw',
  'Boiled',
  'Steamed',
  'Grilled',
  'Baked',
  'Fried',
  'Low-oil',
  'Unsweetened',
  'Other',
] as const;

const NON_VEG_KEYWORDS = [
  'chicken',
  'fish',
  'meat',
  'mutton',
  'beef',
  'pork',
  'prawn',
  'shrimp',
  'egg',
  'seafood',
];

export function isNonVegetarianFood(name: string): boolean {
  const lower = name.toLowerCase();
  return NON_VEG_KEYWORDS.some((k) => lower.includes(k));
}

export function mealDisplayLabel(meal: DietPlanMeal): string {
  if (meal.title?.trim()) return meal.title;
  return MEAL_TYPE_LABELS[meal.mealType];
}
