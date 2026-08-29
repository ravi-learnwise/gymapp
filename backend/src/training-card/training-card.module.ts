import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { TrainingCardController } from './training-card.controller';
import { TrainingCardService } from './training-card.service';
import { TrainingPlanTemplateController } from './training-plan-template.controller';
import { TrainingPlanTemplateService } from './training-plan-template.service';

@Module({
  controllers: [ExerciseController, TrainingCardController, TrainingPlanTemplateController],
  providers: [ExerciseService, TrainingCardService, TrainingPlanTemplateService],
  exports: [ExerciseService, TrainingCardService, TrainingPlanTemplateService],
})
export class TrainingCardModule {}
