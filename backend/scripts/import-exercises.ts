import { PrismaClient } from '@prisma/client';
import { importSimplyFitnessExercises } from './import-exercises.lib';

async function main() {
  const prisma = new PrismaClient();
  try {
    const { imported, missingImages } = await importSimplyFitnessExercises(prisma);
    console.log(`Imported ${imported} active exercises`);
    if (missingImages) {
      console.warn(`${missingImages} exercises reference missing image files`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
