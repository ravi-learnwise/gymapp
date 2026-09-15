import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { TrainingPlanTemplateService } from './training-plan-template.service';
import {
  CreateTrainingPlanTemplateDto,
  TrainingPlanTemplateQueryDto,
  UpdateTrainingPlanTemplateDto,
} from './dto/training-plan-template.dto';

@ApiTags('training-plan-templates')
@ApiBearerAuth()
@Controller('training-plan-templates')
export class TrainingPlanTemplateController {
  constructor(private templateService: TrainingPlanTemplateService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findAll(@Query() query: TrainingPlanTemplateQueryDto) {
    return this.templateService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  create(@Body() dto: CreateTrainingPlanTemplateDto, @CurrentUser() user: AuthUser) {
    return this.templateService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingPlanTemplateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.templateService.update(id, dto, user);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.templateService.deactivate(id, user);
  }
}
