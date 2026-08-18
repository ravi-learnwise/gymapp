import { ExerciseType, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import type { ScrapedExercise } from './exercise-import.types';

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_MANIFEST = path.join(ROOT, 'data', 'simplyfitness-exercises.json');
const UPLOADS_DIR = path.join(ROOT, 'uploads', 'exercises');

function toExerciseType(type: ScrapedExercise['type']): ExerciseType {
  return ExerciseType[type];
}

export async function importSimplyFitnessExercises(
  prisma: PrismaClient,
  manifestPath = DEFAULT_MANIFEST,
) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Manifest not found: ${manifestPath}. Run: npm run scrape:exercises`,
    );
  }

  const exercises = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ScrapedExercise[];
  if (!exercises.length) {
    throw new Error('Manifest is empty');
  }

  let missingImages = 0;

  await prisma.$transaction(async (tx) => {
    await tx.exercise.updateMany({ data: { isActive: false } });

    for (const ex of exercises) {
      const imagePath = path.join(UPLOADS_DIR, ex.imageFile);
      if (!fs.existsSync(imagePath)) {
        missingImages++;
        console.warn(`Missing image: ${ex.imageFile}`);
      }

      await tx.exercise.upsert({
        where: { slug: ex.slug },
        create: {
          slug: ex.slug,
          name: ex.name,
          bodyPart: ex.bodyPart,
          primaryMuscle: ex.primaryMuscle,
          secondaryMuscles: ex.secondaryMuscles,
          muscleGroups: ex.muscleGroups,
          equipment: ex.equipment,
          type: toExerciseType(ex.type),
          imageUrl: ex.imageUrl,
          technique: ex.technique,
          sourceUrl: ex.sourceUrl,
          isActive: true,
        },
        update: {
          name: ex.name,
          bodyPart: ex.bodyPart,
          primaryMuscle: ex.primaryMuscle,
          secondaryMuscles: ex.secondaryMuscles,
          muscleGroups: ex.muscleGroups,
          equipment: ex.equipment,
          type: toExerciseType(ex.type),
          imageUrl: ex.imageUrl,
          technique: ex.technique,
          sourceUrl: ex.sourceUrl,
          isActive: true,
        },
      });
    }
  });

  return { imported: exercises.length, missingImages };
}
