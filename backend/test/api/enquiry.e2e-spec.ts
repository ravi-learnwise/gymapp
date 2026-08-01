import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../helpers/app.helper';
import { loginAs, authHeader } from '../helpers/auth.helper';
import { resetTransactionalData } from '../helpers/db.helper';

describe('Enquiry API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let managerToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    managerToken = await loginAs(app, 'MANAGER');
  });

  beforeEach(async () => {
    await resetTransactionalData(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates enquiry with ENQ number', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/enquiries')
      .set(authHeader(managerToken))
      .send({
        fullName: 'Test Lead',
        mobileNumber: '9876543210',
        leadSource: 'WALK_IN',
      })
      .expect(201);

    expect(res.body.enquiryNumber).toMatch(/^ENQ-\d{4}-\d{4}$/);
    expect(res.body.status).toBe('NEW');
    expect(res.body.fullName).toBe('Test Lead');
  });

  it('rejects invalid status transition NEW → CONVERTED', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/enquiries')
      .set(authHeader(managerToken))
      .send({
        fullName: 'Transition Test',
        mobileNumber: '9876543211',
        leadSource: 'REFERRAL',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/enquiries/${created.body.id}/status`)
      .set(authHeader(managerToken))
      .send({ status: 'CONVERTED' })
      .expect(400);
  });

  it('allows NEW → CONTACTED → TRIAL workflow', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/enquiries')
      .set(authHeader(managerToken))
      .send({
        fullName: 'Workflow Test',
        mobileNumber: '9876543212',
        leadSource: 'WALK_IN',
      })
      .expect(201);

    const id = created.body.id;

    await request(app.getHttpServer())
      .patch(`/api/enquiries/${id}/status`)
      .set(authHeader(managerToken))
      .send({ status: 'CONTACTED' })
      .expect(200);

    const trial = await request(app.getHttpServer())
      .patch(`/api/enquiries/${id}/status`)
      .set(authHeader(managerToken))
      .send({ status: 'TRIAL' })
      .expect(200);

    expect(trial.body.status).toBe('TRIAL');
  });
});
