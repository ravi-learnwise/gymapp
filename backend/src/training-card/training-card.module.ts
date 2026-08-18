import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { TrainingCardController } from './training-card.controller';
import { TrainingCardService } from './training-card.service';

@Module({
  controllers: [ExerciseController, TrainingCardController],
  providers: [ExerciseService, TrainingCardService],
  exports: [ExerciseService, TrainingCardService],
})
export class TrainingCardModule {}
