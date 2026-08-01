import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../helpers/app.helper';
import { loginAs, authHeader } from '../helpers/auth.helper';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login — owner credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'owner@gym.com', password: 'Owner@123' });

    expect([200, 201]).toContain(res.status);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.role).toBe('OWNER');
  });

  it('POST /api/auth/login — rejects invalid password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'owner@gym.com', password: 'WrongPass@123' })
      .expect(401);
  });

  it('GET /api/auth/me — requires auth', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('GET /api/auth/me — returns profile with valid token', async () => {
    const token = await loginAs(app, 'MANAGER');
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader(token))
      .expect(200);

    expect(res.body.email).toBe('manager@gym.com');
    expect(res.body.role).toBe('MANAGER');
  });
});

describe('RBAC API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/enquiries — blocked for trainer', async () => {
    const token = await loginAs(app, 'TRAINER');
    await request(app.getHttpServer())
      .get('/api/enquiries')
      .set(authHeader(token))
      .expect(403);
  });

  it('GET /api/enquiries — allowed for manager', async () => {
    const token = await loginAs(app, 'MANAGER');
    await request(app.getHttpServer())
      .get('/api/enquiries')
      .set(authHeader(token))
      .expect(200);
  });

  it('GET /api/users — blocked for manager', async () => {
    const token = await loginAs(app, 'MANAGER');
    await request(app.getHttpServer())
      .get('/api/users')
      .set(authHeader(token))
      .expect(403);
  });

  it('GET /api/payments — blocked for trainer', async () => {
    const token = await loginAs(app, 'TRAINER');
    await request(app.getHttpServer())
      .get('/api/payments')
      .set(authHeader(token))
      .expect(403);
  });

  it('GET /api/members — allowed for trainer', async () => {
    const token = await loginAs(app, 'TRAINER');
    await request(app.getHttpServer())
      .get('/api/members')
      .set(authHeader(token))
      .expect(200);
  });
});

describe('Health API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health — public', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.phase).toBeGreaterThanOrEqual(4);
  });
});
