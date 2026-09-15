/** Post-process scraped manifest to clean muscle fields. */
import * as fs from 'fs';
import * as path from 'path';
import { buildMuscleGroups } from './exercise-import.types';

const MANIFEST = path.join(__dirname, '..', 'data', 'simplyfitness-exercises.json');

function sanitizeField(text: string | null): string | null {
  if (!text) return null;
  let s = text.split(/\sAt Simply Fitness/i)[0];
  s = s.split('•')[0];
  s = s.split('mlvedaFlagCalled')[0];
  return s.replace(/\s+/g, ' ').trim() || null;
}

const data = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8')) as Array<{
  slug: string;
  primaryMuscle: string | null;
  secondaryMuscles: string | null;
  muscleGroups: string | null;
}>;

for (const ex of data) {
  ex.primaryMuscle = sanitizeField(ex.primaryMuscle);
  ex.secondaryMuscles = sanitizeField(ex.secondaryMuscles);
  ex.muscleGroups = buildMuscleGroups(ex.primaryMuscle, ex.secondaryMuscles);
}

fs.writeFileSync(MANIFEST, JSON.stringify(data, null, 2));
console.log(`Cleaned ${data.length} exercises`);
