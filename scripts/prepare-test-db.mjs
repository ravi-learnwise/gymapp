/**
 * Prepares the isolated test database: push schema + seed.
 * Usage: node --env-file=.env.test scripts/prepare-test-db.mjs
 */
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schema = 'backend/prisma/schema.prisma';

const testDbUrl =
  process.env.TEST_DATABASE_URL ??
  'mysql://gymapp:gymapp_dev@localhost:3306/gymapp_test';

const env = {
  ...process.env,
  DATABASE_URL: testDbUrl,
  SHADOW_DATABASE_URL:
    process.env.SHADOW_DATABASE_URL ??
    'mysql://root@localhost:3306/gymapp_test',
};

console.log('Preparing test database...');
console.log(`  DATABASE_URL=${testDbUrl.replace(/:[^:@]+@/, ':***@')}`);

try {
  execSync(`pnpm exec prisma db push --schema ${schema} --accept-data-loss --skip-generate`, {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  execSync('pnpm exec ts-node backend/prisma/seed.ts', {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  console.log('\nTest database ready.');
} catch {
  console.error('\nFailed to prepare test database.');
  console.error('Ensure MySQL is running and gymapp_test exists.');
  console.error('Run: pnpm test:db:create');
  process.exit(1);
}
