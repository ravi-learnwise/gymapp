import { PrismaService } from '../../src/prisma/prisma.service';

/** Clears transactional CRM data; keeps seeded users, programs, config. */
export async function resetTransactionalData(prisma: PrismaService) {
  await prisma.paymentReminder.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.paymentCommitment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.member.deleteMany();
  await prisma.enquiryReminder.deleteMany();
  await prisma.enquiryStatusHistory.deleteMany();
  await prisma.enquiryNote.deleteMany();
  await prisma.enquiry.deleteMany();
}
