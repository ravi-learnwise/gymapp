export type TrainingSetDraft = {
  setNumber: number;
  reps: number;
  weight?: number;
  weightUnit: 'KG' | 'LB';
};

export type TrainingExerciseDraft = {
  exerciseId: string;
  exerciseName: string;
  imageUrl?: string;
  sectionName?: string;
  restSeconds?: number;
  sets: TrainingSetDraft[];
};

export type TrainingDayDraft = {
  weekday: number;
  dayType: import('../../types/training-card').TrainingDayType;
  notes?: string;
  exercises: TrainingExerciseDraft[];
};

export function emptyTrainingDays(): TrainingDayDraft[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    dayType: 'NOT_ASSIGNED' as const,
    exercises: [],
  }));
}

export function trainingDaysFromCard(card: {
  days: {
    weekday: number;
    dayType: import('../../types/training-card').TrainingDayType;
    notes?: string | null;
    exercises: {
      exerciseId: string;
      exercise: { name: string; imageUrl?: string | null };
      sectionName?: string | null;
      restSeconds?: number | null;
      sets: {
        setNumber: number;
        repMin: number;
        repMax?: number | null;
        weight?: string | number | null;
        weightUnit?: 'KG' | 'LB' | null;
      }[];
    }[];
  }[];
}): TrainingDayDraft[] {
  const base = emptyTrainingDays();
  for (const day of card.days) {
    base[day.weekday] = {
      weekday: day.weekday,
      dayType: day.dayType,
      notes: day.notes ?? undefined,
      exercises: day.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exercise.name,
        imageUrl: ex.exercise.imageUrl ?? undefined,
        sectionName: ex.sectionName ?? undefined,
        restSeconds: ex.restSeconds ?? undefined,
        sets: ex.sets.map((s) => ({
          setNumber: s.setNumber,
          reps: s.repMax ?? s.repMin,
          weight: s.weight ? Number(s.weight) : undefined,
          weightUnit: s.weightUnit ?? 'KG',
        })),
      })),
    };
  }
  return base;
}

export function trainingDaysPayload(days: TrainingDayDraft[]) {
  return days.map((d) => ({
    weekday: d.weekday,
    dayType: d.dayType,
    notes: d.notes,
    displayOrder: d.weekday,
    exercises: d.exercises.map((ex, i) => ({
      exerciseId: ex.exerciseId,
      sectionName: ex.sectionName,
      displayOrder: i,
      restSeconds: ex.restSeconds,
      sets: ex.sets.map((s) => ({
        setNumber: s.setNumber,
        repMin: s.reps,
        repMax: s.reps,
        weight: s.weight,
        weightUnit: s.weightUnit,
      })),
    })),
  }));
}
