import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ExerciseService } from './exercise.service';
import {
  CreateExerciseDto,
  ExerciseQueryDto,
  UpdateExerciseDto,
} from './dto/exercise.dto';

@ApiTags('exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExerciseController {
  constructor(private exerciseService: ExerciseService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findAll(@Query() query: ExerciseQueryDto) {
    return this.exerciseService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findOne(@Param('id') id: string) {
    return this.exerciseService.findOne(id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() dto: CreateExerciseDto, @CurrentUser() user: AuthUser) {
    return this.exerciseService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  deactivate(@Param('id') id: string) {
    return this.exerciseService.deactivate(id);
  }
}
