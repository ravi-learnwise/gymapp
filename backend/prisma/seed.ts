import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 1 data...');

  const ownerHash = await bcrypt.hash('Owner@123', 10);
  const managerHash = await bcrypt.hash('Manager@123', 10);
  const trainerHash = await bcrypt.hash('Trainer@123', 10);

  await prisma.user.upsert({
    where: { email: 'owner@gym.com' },
    update: {},
    create: {
      email: 'owner@gym.com',
      passwordHash: ownerHash,
      role: UserRole.OWNER,
      firstName: 'Gym',
      lastName: 'Owner',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@gym.com' },
    update: {},
    create: {
      email: 'manager@gym.com',
      passwordHash: managerHash,
      role: UserRole.MANAGER,
      firstName: 'Gym',
      lastName: 'Manager',
    },
  });

  await prisma.user.upsert({
    where: { email: 'trainer@gym.com' },
    update: {},
    create: {
      email: 'trainer@gym.com',
      passwordHash: trainerHash,
      role: UserRole.TRAINER,
      firstName: 'Gym',
      lastName: 'Trainer',
    },
  });

  const gym = await prisma.gymConfig.findFirst();
  if (!gym) {
    await prisma.gymConfig.create({
      data: {
        name: 'FitLife Gym',
        address: '123 Main Street, City',
        gstNumber: 'GSTIN123456',
        attendanceEnabled: false,
      },
    });
  }

  const programCount = await prisma.program.count();
  if (programCount === 0) {
    const gymProgram = await prisma.program.create({
      data: {
        name: 'General Fitness',
        description: 'Standard gym membership',
        durations: {
          create: [
            { label: '1 Month', months: 1, price: 2000 },
            { label: '3 Months', months: 3, price: 5000 },
            { label: '6 Months', months: 6, price: 9000 },
            { label: '12 Months', months: 12, price: 15000 },
          ],
        },
      },
    });
    console.log(`Created program: ${gymProgram.name}`);
  }

  const discountCount = await prisma.discountCategory.count();
  if (discountCount === 0) {
    await prisma.discountCategory.createMany({
      data: [
        { name: 'Student', description: 'Student discount', percentage: 10 },
        { name: 'Corporate', description: 'Corporate tie-up', percentage: 15 },
        { name: 'Referral', description: 'Member referral', percentage: 5 },
      ],
    });
  }

  const offerCount = await prisma.offerCategory.count();
  if (offerCount === 0) {
    await prisma.offerCategory.createMany({
      data: [
        { name: 'New Year Offer', description: 'Seasonal promotion' },
        { name: 'Festival Offer', description: 'Festival season' },
        { name: 'Walk-in Special', description: 'Same-day enrollment' },
      ],
    });
  }

  await prisma.schemaVersion.upsert({
    where: { id: 1 },
    update: { version: 'phase-4' },
    create: { version: 'phase-4' },
  });

  console.log('\nSeed accounts:');
  console.log('  Owner:   owner@gym.com   / Owner@123');
  console.log('  Manager: manager@gym.com / Manager@123');
  console.log('  Trainer: trainer@gym.com / Trainer@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
