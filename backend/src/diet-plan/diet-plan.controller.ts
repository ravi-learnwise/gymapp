import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { DietPlanService } from './diet-plan.service';
import {
  CopyDayDto,
  CopyMealDto,
  CreateDietPlanDto,
  PublishDietPlanDto,
  ReviseDietPlanDto,
  UpdateDietPlanDto,
} from './dto/diet-plan.dto';

@ApiTags('diet-plans')
@ApiBearerAuth()
@Controller('diet-plans')
export class DietPlanController {
  constructor(private dietPlanService: DietPlanService) {}

  @Get('due-reviews')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findDueReviews() {
    return this.dietPlanService.findDueReviews();
  }

  @Get('member/:memberId/active')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findActiveByMember(
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dietPlanService.findActiveByMember(memberId, user);
  }

  @Get('member/:memberId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findByMember(
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dietPlanService.findByMember(memberId, user);
  }

  @Get(':id/versions')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  getVersions(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dietPlanService.getVersions(id, user);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dietPlanService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  create(@Body() dto: CreateDietPlanDto, @CurrentUser() user: AuthUser) {
    return this.dietPlanService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDietPlanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dietPlanService.update(id, dto, user);
  }

  @Post(':id/publish')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  publish(
    @Param('id') id: string,
    @Body() dto: PublishDietPlanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dietPlanService.publish(id, dto, user);
  }

  @Post(':id/revise')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  revise(
    @Param('id') id: string,
    @Body() dto: ReviseDietPlanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dietPlanService.revise(id, dto, user);
  }

  @Post(':id/archive')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  archive(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dietPlanService.archive(id, user);
  }

  @Post(':id/days/:weekday/copy')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  copyDay(
    @Param('id') id: string,
    @Param('weekday') weekday: string,
    @Body() dto: CopyDayDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dietPlanService.copyDay(id, Number(weekday), dto, user);
  }
}

@ApiTags('diet-plans')
@ApiBearerAuth()
@Controller('diet-plan-meals')
export class DietPlanMealController {
  constructor(private dietPlanService: DietPlanService) {}

  @Post(':mealId/copy')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  copyMeal(
    @Param('mealId') mealId: string,
    @Body() dto: CopyMealDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dietPlanService.copyMeal(mealId, dto, user);
  }
}
