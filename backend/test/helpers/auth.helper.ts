import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type TestRole = 'OWNER' | 'MANAGER' | 'TRAINER';

const CREDENTIALS: Record<TestRole, { email: string; password: string }> = {
  OWNER: { email: 'owner@gym.com', password: 'Owner@123' },
  MANAGER: { email: 'manager@gym.com', password: 'Manager@123' },
  TRAINER: { email: 'trainer@gym.com', password: 'Trainer@123' },
};

export async function loginAs(
  app: INestApplication,
  role: TestRole,
): Promise<string> {
  const { email, password } = CREDENTIALS[role];
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login failed for ${role}: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body.accessToken as string;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
