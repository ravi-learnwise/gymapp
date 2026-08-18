import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { TrainingCardService } from './training-card.service';
import {
  CreateTrainingCardDto,
  PublishTrainingCardDto,
  ReviseTrainingCardDto,
  UpdateTrainingCardDto,
} from './dto/training-card.dto';

@ApiTags('training-cards')
@ApiBearerAuth()
@Controller('training-cards')
export class TrainingCardController {
  constructor(private trainingCardService: TrainingCardService) {}

  @Get('due-reviews')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findDueReviews() {
    return this.trainingCardService.findDueReviews();
  }

  @Get('member/:memberId/active')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findActiveByMember(
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.trainingCardService.findActiveByMember(memberId, user);
  }

  @Get('member/:memberId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findByMember(
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.trainingCardService.findByMember(memberId, user);
  }

  @Get(':id/versions')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  getVersions(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.trainingCardService.getVersions(id, user);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.trainingCardService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  create(@Body() dto: CreateTrainingCardDto, @CurrentUser() user: AuthUser) {
    return this.trainingCardService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingCardDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.trainingCardService.update(id, dto, user);
  }

  @Post(':id/publish')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  publish(
    @Param('id') id: string,
    @Body() dto: PublishTrainingCardDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.trainingCardService.publish(id, dto, user);
  }

  @Post(':id/revise')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  revise(
    @Param('id') id: string,
    @Body() dto: ReviseTrainingCardDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.trainingCardService.revise(id, dto, user);
  }

  @Post(':id/archive')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  archive(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.trainingCardService.archive(id, user);
  }
}
