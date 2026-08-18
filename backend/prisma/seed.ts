import { PrismaClient, UserRole, ExerciseType } from '@prisma/client';
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

  const exerciseCount = await prisma.exercise.count();
  if (exerciseCount === 0) {
    const exercises: Array<{
      name: string;
      muscleGroups: string;
      equipment?: string;
      type: ExerciseType;
    }> = [
      { name: 'Barbell Bench Press', muscleGroups: 'Chest, Triceps', equipment: 'Barbell', type: ExerciseType.STRENGTH },
      { name: 'Incline Dumbbell Press', muscleGroups: 'Chest', equipment: 'Dumbbells', type: ExerciseType.STRENGTH },
      { name: 'Cable Fly', muscleGroups: 'Chest', equipment: 'Cable', type: ExerciseType.STRENGTH },
      { name: 'Push-up', muscleGroups: 'Chest, Triceps', type: ExerciseType.BODYWEIGHT },
      { name: 'Lat Pulldown', muscleGroups: 'Back', equipment: 'Cable', type: ExerciseType.STRENGTH },
      { name: 'Barbell Row', muscleGroups: 'Back', equipment: 'Barbell', type: ExerciseType.STRENGTH },
      { name: 'Seated Cable Row', muscleGroups: 'Back', equipment: 'Cable', type: ExerciseType.STRENGTH },
      { name: 'Pull-up', muscleGroups: 'Back, Biceps', equipment: 'Pull-up bar', type: ExerciseType.BODYWEIGHT },
      { name: 'Overhead Press', muscleGroups: 'Shoulders', equipment: 'Barbell', type: ExerciseType.STRENGTH },
      { name: 'Lateral Raise', muscleGroups: 'Shoulders', equipment: 'Dumbbells', type: ExerciseType.STRENGTH },
      { name: 'Face Pull', muscleGroups: 'Rear Delts', equipment: 'Cable', type: ExerciseType.STRENGTH },
      { name: 'Barbell Squat', muscleGroups: 'Quads, Glutes', equipment: 'Barbell', type: ExerciseType.STRENGTH },
      { name: 'Leg Press', muscleGroups: 'Quads, Glutes', equipment: 'Machine', type: ExerciseType.STRENGTH },
      { name: 'Leg Curl', muscleGroups: 'Hamstrings', equipment: 'Machine', type: ExerciseType.STRENGTH },
      { name: 'Leg Extension', muscleGroups: 'Quads', equipment: 'Machine', type: ExerciseType.STRENGTH },
      { name: 'Romanian Deadlift', muscleGroups: 'Hamstrings, Glutes', equipment: 'Barbell', type: ExerciseType.STRENGTH },
      { name: 'Walking Lunge', muscleGroups: 'Quads, Glutes', equipment: 'Dumbbells', type: ExerciseType.STRENGTH },
      { name: 'Calf Raise', muscleGroups: 'Calves', equipment: 'Machine', type: ExerciseType.STRENGTH },
      { name: 'Barbell Curl', muscleGroups: 'Biceps', equipment: 'Barbell', type: ExerciseType.STRENGTH },
      { name: 'Hammer Curl', muscleGroups: 'Biceps, Forearms', equipment: 'Dumbbells', type: ExerciseType.STRENGTH },
      { name: 'Tricep Pushdown', muscleGroups: 'Triceps', equipment: 'Cable', type: ExerciseType.STRENGTH },
      { name: 'Skull Crusher', muscleGroups: 'Triceps', equipment: 'EZ Bar', type: ExerciseType.STRENGTH },
      { name: 'Plank', muscleGroups: 'Core', type: ExerciseType.BODYWEIGHT },
      { name: 'Cable Crunch', muscleGroups: 'Core', equipment: 'Cable', type: ExerciseType.STRENGTH },
      { name: 'Hanging Leg Raise', muscleGroups: 'Core', equipment: 'Pull-up bar', type: ExerciseType.BODYWEIGHT },
      { name: 'Treadmill Run', muscleGroups: 'Cardio', equipment: 'Treadmill', type: ExerciseType.CARDIO },
      { name: 'Stationary Bike', muscleGroups: 'Cardio', equipment: 'Bike', type: ExerciseType.CARDIO },
      { name: 'Rowing Machine', muscleGroups: 'Cardio, Back', equipment: 'Rower', type: ExerciseType.CARDIO },
      { name: 'Jump Rope', muscleGroups: 'Cardio', equipment: 'Jump rope', type: ExerciseType.CARDIO },
      { name: 'Hip Flexor Stretch', muscleGroups: 'Hips', type: ExerciseType.FLEXIBILITY },
      { name: 'Hamstring Stretch', muscleGroups: 'Hamstrings', type: ExerciseType.FLEXIBILITY },
      { name: 'Shoulder Dislocates', muscleGroups: 'Shoulders', equipment: 'Band', type: ExerciseType.FLEXIBILITY },
      { name: 'Deadlift', muscleGroups: 'Back, Glutes, Hamstrings', equipment: 'Barbell', type: ExerciseType.STRENGTH },
      { name: 'Dumbbell Shoulder Press', muscleGroups: 'Shoulders', equipment: 'Dumbbells', type: ExerciseType.STRENGTH },
      { name: 'Goblet Squat', muscleGroups: 'Quads, Glutes', equipment: 'Kettlebell', type: ExerciseType.STRENGTH },
    ];
    await prisma.exercise.createMany({
      data: exercises.map((e) => ({
        ...e,
        imageUrl: 'https://placehold.co/400x300?text=Exercise',
        technique: 'Maintain controlled form throughout the movement.',
        safetyNotes: 'Stop if you feel pain. Use appropriate weight.',
      })),
    });
    console.log(`Seeded ${exercises.length} exercises`);
  }

  await prisma.schemaVersion.upsert({
    where: { id: 1 },
    update: { version: 'phase-v2' },
    create: { version: 'phase-v2' },
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
