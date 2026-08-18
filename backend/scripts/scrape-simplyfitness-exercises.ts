/**
 * One-time developer tool: scrape SimplyFitness exercise library.
 * Run: npm run scrape:exercises
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  BASE_URL,
  buildMuscleGroups,
  CATEGORY_PAGES,
  inferExerciseType,
  type ScrapedExercise,
} from './exercise-import.types';

const ROOT = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT, 'uploads', 'exercises');
const MANIFEST_PATH = path.join(ROOT, 'data', 'simplyfitness-exercises.json');
const DELAY_MS = 500;

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isExercisePage(href: string): boolean {
  if (!href.startsWith('/pages/')) return false;
  const slug = href.replace('/pages/', '').split('?')[0];
  if (!slug || slug.includes('/')) return false;
  return !SKIP_PAGE_PATTERNS.some((p) => slug.includes(p) || href.includes(p));
}

function normalizeUrl(src: string): string {
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return `${BASE_URL}${src}`;
  return src;
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

function extractH1(html: string): string | null {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? decodeHtml(m[1]) : null;
}

function sanitizeField(text: string | null): string | null {
  if (!text) return null;
  let s = text.split(/\sAt Simply Fitness/i)[0];
  s = s.split('•')[0];
  s = s.split('mlvedaFlagCalled')[0];
  return s.replace(/\s+/g, ' ').trim() || null;
}

function sectionAfterHeading(html: string, headings: string[]): string | null {
  for (const heading of headings) {
    const re = new RegExp(
      `<h[234][^>]*>\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*<\\/h[234]>([\\s\\S]*?)(?=<h[234]|id="shopify-section-footer"|class="footer|<footer|$)`,
      'i',
    );
    const m = html.match(re);
    if (m) {
      const pMatch = m[1].match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const raw = pMatch ? pMatch[1] : m[1];
      const text = sanitizeField(decodeHtml(raw));
      if (text) return text;
    }

    const plain = html.match(
      new RegExp(`${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:\\s]*([^<\\n]+)`, 'i'),
    );
    if (plain?.[1]) return sanitizeField(decodeHtml(plain[1]));
  }
  return null;
}

function extractTechnique(html: string): string | null {
  const starting = sectionAfterHeading(html, ['Starting position']);
  const execution = sectionAfterHeading(html, ['Execution']);
  const parts: string[] = [];
  if (starting) parts.push(`Starting position:\n${starting}`);
  if (execution) parts.push(`Execution:\n${execution}`);

  const tips = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => decodeHtml(m[1]))
    .filter((t) => t.startsWith('Keep your') || t.includes('During the whole movement'));

  if (tips.length) parts.push(tips.join('\n'));
  return parts.length ? parts.join('\n\n') : null;
}

function pickIllustration(html: string): string | null {
  type Candidate = { src: string; score: number };
  const candidates: Candidate[] = [];
  const re = /<img[^>]+>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const srcMatch = tag.match(/\ssrc="([^"]+)"/i) ?? tag.match(/\sdata-src="([^"]+)"/i);
    if (!srcMatch) continue;
    const src = srcMatch[1];
    if (!src.includes('cdn.shopify.com')) continue;
    if (src.endsWith('.svg') || src.includes('logo')) continue;

    let score = 10;
    if (/\.(png|jpg|jpeg|webp)/i.test(src)) score += 5;
    const w = tag.match(/width="(\d+)"/i);
    const h = tag.match(/height="(\d+)"/i);
    if (w) score += Math.min(Number(w[1]), 2000) / 100;
    if (h) score += Math.min(Number(h[1]), 2000) / 100;
    candidates.push({ src: normalizeUrl(src), score });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.src ?? null;
}

function extensionFromUrl(url: string): string {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'png';
  if (clean.endsWith('.webp')) return 'webp';
  if (clean.endsWith('.gif')) return 'gif';
  return 'jpg';
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'GymApp-ExerciseImport/1.0 (local dev; one-time import)',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function downloadImage(url: string, destPath: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GymApp-ExerciseImport/1.0' },
  });
  if (!res.ok) throw new Error(`Image HTTP ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

async function scrapeDetail(slug: string, bodyPart: string): Promise<ScrapedExercise | null> {
  const sourceUrl = `${BASE_URL}/pages/${slug}`;
  const html = await fetchHtml(sourceUrl);

  const name =
    extractH1(html) ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const equipment = sectionAfterHeading(html, ['Equipment required', 'Equipment']);
  const primaryMuscle = sectionAfterHeading(html, ['Main muscles', 'Main muscle']);
  const secondaryMuscles = sectionAfterHeading(html, ['Secondary muscles', 'Secondary muscle']);
  const technique = extractTechnique(html);
  const imageRemote = pickIllustration(html);

  if (!imageRemote) {
    console.warn(`  [skip] No illustration: ${slug}`);
    return null;
  }

  const ext = extensionFromUrl(imageRemote);
  const imageFile = `${slug}.${ext}`;
  const imagePath = path.join(UPLOADS_DIR, imageFile);
  await downloadImage(imageRemote, imagePath);

  const type = inferExerciseType(name, equipment);
  const muscleGroups = buildMuscleGroups(primaryMuscle, secondaryMuscles);

  return {
    slug,
    name,
    bodyPart,
    primaryMuscle,
    secondaryMuscles,
    equipment,
    technique,
    muscleGroups,
    type,
    imageUrl: `/api/media/exercises/${imageFile}`,
    imageFile,
    sourceUrl,
  };
}

function extractCategoryExerciseLinks(html: string): string[] {
  const h1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  const startIdx = h1Match ? html.indexOf(h1Match[0]) + h1Match[0].length : 0;
  const footerIdx = html.search(/id="shopify-section-footer"|class="footer|<footer/i);
  const slice = html.slice(startIdx, footerIdx > startIdx ? footerIdx : undefined);
  return extractLinks(slice);
}

async function collectSlugs(): Promise<Map<string, string>> {
  const slugToBodyPart = new Map<string, string>();

  for (const cat of CATEGORY_PAGES) {
    const url = `${BASE_URL}${cat.path}`;
    console.log(`Fetching category: ${cat.bodyPart} (${url})`);
    const html = await fetchHtml(url);
    for (const slug of extractCategoryExerciseLinks(html)) {
      slugToBodyPart.set(slug, cat.bodyPart);
    }
    await sleep(DELAY_MS);
  }

  return slugToBodyPart;
}

async function main() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

  const slugMap = await collectSlugs();
  console.log(`Found ${slugMap.size} exercise pages`);

  const results: ScrapedExercise[] = [];
  let i = 0;

  for (const [slug, bodyPart] of slugMap) {
    i++;
    process.stdout.write(`[${i}/${slugMap.size}] ${slug} ... `);
    try {
      const ex = await scrapeDetail(slug, bodyPart);
      if (ex) {
        results.push(ex);
        console.log('ok');
      } else {
        console.log('skipped');
      }
    } catch (err) {
      console.log(`error: ${err instanceof Error ? err.message : err}`);
    }
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${results.length} exercises to ${MANIFEST_PATH}`);
  console.log(`Images in ${UPLOADS_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
