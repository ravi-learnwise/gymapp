export type ProgramEnrollmentType = 'INDEPENDENT' | 'ADD_ON';

export type TrainingCardStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
export type TrainingDayType = 'WORKOUT' | 'REST' | 'RECOVERY' | 'NOT_ASSIGNED';
export type WeightUnit = 'KG' | 'LB';
export type ExerciseType = 'STRENGTH' | 'CARDIO' | 'FLEXIBILITY' | 'BODYWEIGHT' | 'OTHER';

export type Exercise = {
  id: string;
  name: string;
  muscleGroups: string | null;
  equipment: string | null;
  type: ExerciseType;
  imageUrl: string | null;
  technique: string | null;
  safetyNotes: string | null;
  isActive: boolean;
};

export type TrainingCardSet = {
  id: string;
  setNumber: number;
  repMin: number;
  repMax: number | null;
  weight: string | null;
  weightUnit: WeightUnit | null;
  durationSeconds: number | null;
  notes: string | null;
};

export type TrainingCardExercise = {
  id: string;
  exerciseId: string;
  sectionName: string | null;
  displayOrder: number;
  restSeconds: number | null;
  notes: string | null;
  exercise: Exercise;
  sets: TrainingCardSet[];
};

export type TrainingCardDay = {
  id: string;
  weekday: number;
  dayType: TrainingDayType;
  notes: string | null;
  displayOrder: number;
  exercises: TrainingCardExercise[];
};

export type TrainingCard = {
  id: string;
  memberId: string;
  name: string;
  description: string | null;
  status: TrainingCardStatus;
  version: number;
  effectiveFrom: string | null;
  reviewDate: string | null;
  previousVersionId: string | null;
  days: TrainingCardDay[];
  member?: { id: string; memberNumber: string; fullName: string };
  createdBy?: { firstName: string | null; lastName: string | null };
};

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const DAY_TYPE_LABELS: Record<TrainingDayType, string> = {
  WORKOUT: 'Workout',
  REST: 'Rest',
  RECOVERY: 'Recovery',
  NOT_ASSIGNED: 'Not assigned',
};

export const ENROLLMENT_TYPE_LABELS: Record<ProgramEnrollmentType, string> = {
  INDEPENDENT: 'Independent',
  ADD_ON: 'Add-on',
};
