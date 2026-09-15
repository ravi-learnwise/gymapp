/**
 * Re-map exercise bodyPart values from SimplyFitness category index pages.
 * Run: npx ts-node --transpile-only scripts/fix-exercise-bodyparts.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  BASE_URL,
  CATEGORY_PAGES,
  type ScrapedExercise,
} from './exercise-import.types';

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'simplyfitness-exercises.json');

const SKIP_PAGE_PATTERNS = [
  'exercise-guides',
  'workout-exercise-guides',
  'fitness-tools',
  'calculator',
  'workout-builder',
  'meal-plan',
  'products/',
  'collections/',
  'blogs/',
  'contact-us',
  'contact',
];

function isExercisePage(href: string): boolean {
  if (!href.startsWith('/pages/')) return false;
  const slug = href.replace('/pages/', '').split('?')[0];
  if (!slug || slug.includes('/')) return false;
  return !SKIP_PAGE_PATTERNS.some((p) => slug.includes(p) || href.includes(p));
}

function extractLinks(html: string): string[] {
  const slugs: string[] = [];
  const re = /href="(\/pages\/[^"#?]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (!isExercisePage(href)) continue;
    const slug = href.replace('/pages/', '');
    if (!slugs.includes(slug)) slugs.push(slug);
  }
  return slugs;
}

/** Only links in main category content (after h1, before footer). */
function extractCategoryExerciseLinks(html: string): string[] {
  const h1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  const startIdx = h1Match ? html.indexOf(h1Match[0]) + h1Match[0].length : 0;
  const footerIdx = html.search(/id="shopify-section-footer"|class="footer|<footer/i);
  const slice = html.slice(startIdx, footerIdx > startIdx ? footerIdx : undefined);
  return extractLinks(slice);
}

function countByBodyPart(exercises: ScrapedExercise[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ex of exercises) {
    const key = ex.bodyPart || '(empty)';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function inferBodyPartFromPrimary(primary: string | null, slug: string): string | null {
  const p = (primary ?? '').toLowerCase();
  const s = slug.toLowerCase();

  if (p.includes('calf') || s.includes('calf')) return 'Calves';
  if (
    p.includes('abdom') ||
    p.includes('abs') ||
    p.includes('oblique') ||
    p.includes('core') ||
    s.includes('crunch') ||
    s.includes('plank') ||
    s.includes('leg-raise') ||
    s.includes('bird-dog')
  ) {
    return 'Abdominals';
  }
  if (p.includes('forearm') || s.includes('wrist')) return 'Biceps';
  if (p.includes('bicep') || (s.includes('curl') && !s.includes('leg-curl'))) return 'Biceps';
  if (
    p.includes('tricep') ||
    s.includes('triceps') ||
    s.includes('pushdown') ||
    s.includes('kickback') ||
    s.includes('french-press') ||
    s.includes('dip')
  ) {
    return 'Triceps';
  }
  if (p.includes('shoulder') || p.includes('deltoid')) return 'Shoulders';
  if (p.includes('lower chest') || (p.includes('chest') && !p.includes('back'))) return 'Chest';
  if (p.includes('back') || p.includes('lat') || p.includes('trap')) return 'Back';
  if (
    p.includes('thigh') ||
    p.includes('buttock') ||
    p.includes('quad') ||
    p.includes('hamstring') ||
    p.includes('glute') ||
    p.includes('hip') ||
    s.includes('squat') ||
    s.includes('lunge') ||
    s.includes('leg-')
  ) {
    return 'Legs';
  }
  return null;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'GymApp-ExerciseImport/1.0 (local dev; bodypart fix)',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function buildSlugBodyPartMap(): Promise<Map<string, string>> {
  const slugToBodyPart = new Map<string, string>();

  for (const cat of CATEGORY_PAGES) {
    const url = `${BASE_URL}${cat.path}`;
    console.log(`Fetching ${cat.bodyPart}: ${url}`);
    const html = await fetchHtml(url);
    const slugs = extractCategoryExerciseLinks(html);
    console.log(`  ${slugs.length} exercises`);
    for (const slug of slugs) {
      slugToBodyPart.set(slug, cat.bodyPart);
    }
  }

  return slugToBodyPart;
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest not found: ${MANIFEST_PATH}`);
  }

  const exercises = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as ScrapedExercise[];
  const beforeCounts = countByBodyPart(exercises);

  const slugMap = await buildSlugBodyPartMap();

  let fromCategory = 0;
  let fromPrimary = 0;
  let unresolved = 0;

  for (const ex of exercises) {
    const mapped = slugMap.get(ex.slug);
    if (mapped) {
      ex.bodyPart = mapped;
      fromCategory++;
      continue;
    }
    const inferred = inferBodyPartFromPrimary(ex.primaryMuscle, ex.slug);
    if (inferred) {
      ex.bodyPart = inferred;
      fromPrimary++;
    } else {
      unresolved++;
      console.warn(`Unresolved bodyPart for ${ex.slug} (primary: ${ex.primaryMuscle})`);
    }
  }

  const afterCounts = countByBodyPart(exercises);

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(exercises, null, 2));
  console.log('\nBefore:', beforeCounts);
  console.log('After:', afterCounts);
  console.log(`Fixed via category pages: ${fromCategory}, via primary muscle: ${fromPrimary}, unresolved: ${unresolved}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
