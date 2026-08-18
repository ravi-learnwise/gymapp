export type ScrapedExercise = {
  slug: string;
  name: string;
  bodyPart: string;
  primaryMuscle: string | null;
  secondaryMuscles: string | null;
  equipment: string | null;
  technique: string | null;
  muscleGroups: string | null;
  type: 'STRENGTH' | 'CARDIO' | 'FLEXIBILITY' | 'BODYWEIGHT' | 'OTHER';
  imageUrl: string;
  imageFile: string;
  sourceUrl: string;
};

export const CATEGORY_PAGES: Array<{ bodyPart: string; path: string }> = [
  { bodyPart: 'Chest', path: '/pages/chest-exercise-guides' },
  { bodyPart: 'Back', path: '/pages/back-exercise-guides' },
  { bodyPart: 'Shoulders', path: '/pages/shoulders-exercise-guides' },
  { bodyPart: 'Biceps', path: '/pages/biceps-exercise-guides' },
  { bodyPart: 'Triceps', path: '/pages/triceps-exercise-guides' },
  { bodyPart: 'Abdominals', path: '/pages/abdominals-exercise-guides' },
  { bodyPart: 'Legs', path: '/pages/legs-exercise-guides' },
  { bodyPart: 'Calves', path: '/pages/calves-exercise-guides' },
];

export const BASE_URL = 'https://www.simplyfitness.com';

export function inferExerciseType(
  name: string,
  equipment: string | null,
): ScrapedExercise['type'] {
  const lower = `${name} ${equipment ?? ''}`.toLowerCase();
  if (
    !equipment?.trim() ||
    lower.includes('push up') ||
    lower.includes('push-up') ||
    lower.includes('pull up') ||
    lower.includes('pull-up') ||
    lower.includes('bodyweight')
  ) {
    return 'BODYWEIGHT';
  }
  if (lower.includes('stretch') || lower.includes('flexibility')) {
    return 'FLEXIBILITY';
  }
  if (
    lower.includes('treadmill') ||
    lower.includes('bike') ||
    lower.includes('cardio') ||
    lower.includes('rower')
  ) {
    return 'CARDIO';
  }
  return 'STRENGTH';
}

export function buildMuscleGroups(
  primary: string | null,
  secondary: string | null,
): string | null {
  const parts: string[] = [];
  if (primary?.trim()) parts.push(`Primary: ${primary.trim()}`);
  if (secondary?.trim()) parts.push(`Secondary: ${secondary.trim()}`);
  return parts.length ? parts.join('; ') : null;
}
