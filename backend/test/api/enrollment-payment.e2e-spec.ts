import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../helpers/app.helper';
import { loginAs, authHeader } from '../helpers/auth.helper';
import { resetTransactionalData } from '../helpers/db.helper';

describe('Enrollment & Payment flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let programId: string;
  let durationId: string;
  let trainerId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    ownerToken = await loginAs(app, 'OWNER');

    const program = await prisma.program.findFirst({
      include: { durations: true },
    });
    if (!program?.durations.length) {
      throw new Error('Seed program required for enrollment tests');
    }
    programId = program.id;
    durationId = program.durations[0].id;

    const trainer = await prisma.user.findUnique({
      where: { email: 'trainer@gym.com' },
    });
    if (!trainer) throw new Error('Seed trainer required');
    trainerId = trainer.id;
  });

  beforeEach(async () => {
    await resetTransactionalData(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createTrialEnquiry() {
    const enquiry = await request(app.getHttpServer())
      .post('/api/enquiries')
      .set(authHeader(ownerToken))
      .send({
        fullName: 'Enroll Me',
        mobileNumber: '9123456789',
        leadSource: 'WALK_IN',
        offeredProgramId: programId,
      })
      .expect(201);

    const id = enquiry.body.id;
    await request(app.getHttpServer())
      .patch(`/api/enquiries/${id}/status`)
      .set(authHeader(ownerToken))
      .send({ status: 'CONTACTED' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/enquiries/${id}/status`)
      .set(authHeader(ownerToken))
      .send({ status: 'TRIAL' })
      .expect(200);

    return id as string;
  }

  it('enrollment creates member, marks enquiry CONVERTED, creates payment commitment', async () => {
    const enquiryId = await createTrialEnquiry();

    const enrollment = await request(app.getHttpServer())
      .post('/api/enrollments')
      .set(authHeader(ownerToken))
      .send({
        enquiryId,
        programId,
        programDurationId: durationId,
        trainerId,
        startDate: '2026-08-01',
        height: 170,
        weight: 70,
      })
      .expect(201);

    expect(enrollment.body.enrollmentNumber).toMatch(/^ENR-\d{4}-\d{4}$/);
    expect(enrollment.body.member.memberNumber).toMatch(/^MEM-\d{4}-\d{4}$/);

    const enquiry = await request(app.getHttpServer())
      .get(`/api/enquiries/${enquiryId}`)
      .set(authHeader(ownerToken))
      .expect(200);
    expect(enquiry.body.status).toBe('CONVERTED');

    const payments = await request(app.getHttpServer())
      .get(`/api/payments/member/${enrollment.body.member.id}`)
      .set(authHeader(ownerToken))
      .expect(200);

    expect(payments.body).toHaveLength(1);
    expect(payments.body[0].status).toBe('PENDING');
    expect(Number(payments.body[0].pendingAmount)).toBeGreaterThan(0);
  });

  it('records partial payment and updates status', async () => {
    const enquiryId = await createTrialEnquiry();

    const enrollment = await request(app.getHttpServer())
      .post('/api/enrollments')
      .set(authHeader(ownerToken))
      .send({
        enquiryId,
        programId,
        programDurationId: durationId,
        startDate: '2026-08-01',
      })
      .expect(201);

    const memberId = enrollment.body.member.id;
    const payments = await request(app.getHttpServer())
      .get(`/api/payments/member/${memberId}`)
      .set(authHeader(ownerToken))
      .expect(200);

    const commitmentId = payments.body[0].id;
    const finalAmount = Number(payments.body[0].finalAmount);

    await request(app.getHttpServer())
      .post(`/api/payments/${commitmentId}/transactions`)
      .set(authHeader(ownerToken))
      .send({ amount: finalAmount / 2, paymentMode: 'CASH' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .get(`/api/payments/${commitmentId}`)
      .set(authHeader(ownerToken))
      .expect(200);

    expect(updated.body.status).toBe('PARTIAL');
    expect(updated.body.transactions).toHaveLength(1);
    expect(updated.body.transactions[0].receiptNumber).toMatch(/^RCP-\d{4}-\d{4}$/);
  });

  it('rejects overpayment', async () => {
    const enquiryId = await createTrialEnquiry();

    const enrollment = await request(app.getHttpServer())
      .post('/api/enrollments')
      .set(authHeader(ownerToken))
      .send({
        enquiryId,
        programId,
        programDurationId: durationId,
        startDate: '2026-08-01',
      })
      .expect(201);

    const payments = await request(app.getHttpServer())
      .get(`/api/payments/member/${enrollment.body.member.id}`)
      .set(authHeader(ownerToken))
      .expect(200);

    const commitmentId = payments.body[0].id;
    const finalAmount = Number(payments.body[0].finalAmount);

    await request(app.getHttpServer())
      .post(`/api/payments/${commitmentId}/transactions`)
      .set(authHeader(ownerToken))
      .send({ amount: finalAmount + 1000, paymentMode: 'CASH' })
      .expect(400);
  });
});
