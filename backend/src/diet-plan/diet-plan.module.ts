import { Module } from '@nestjs/common';
import { DietPlanController, DietPlanMealController } from './diet-plan.controller';
import { DietPlanService } from './diet-plan.service';

@Module({
  controllers: [DietPlanController, DietPlanMealController],
  providers: [DietPlanService],
  exports: [DietPlanService],
})
export class DietPlanModule {}
