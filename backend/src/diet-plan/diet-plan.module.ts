import { Module } from '@nestjs/common';
import { DietPlanController, DietPlanMealController } from './diet-plan.controller';
import { DietPlanService } from './diet-plan.service';
import { DietPlanTemplateController } from './diet-plan-template.controller';
import { DietPlanTemplateService } from './diet-plan-template.service';

@Module({
  controllers: [DietPlanController, DietPlanMealController, DietPlanTemplateController],
  providers: [DietPlanService, DietPlanTemplateService],
  exports: [DietPlanService, DietPlanTemplateService],
})
export class DietPlanModule {}
