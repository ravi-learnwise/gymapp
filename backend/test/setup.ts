import { config } from 'dotenv';
import { resolve } from 'path';

const root = resolve(__dirname, '../..');
config({ path: resolve(root, '.env') });
config({ path: resolve(root, '.env.test'), override: true });

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'mysql://gymapp:gymapp_dev@localhost:3306/gymapp_test';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-min-32-characters-long';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-min-32-characters-long';
process.env.API_PREFIX ??= 'api';

// API integration tests boot Nest + MySQL — allow longer hooks
jest.setTimeout(60_000);
