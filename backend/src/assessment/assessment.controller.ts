import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/assessment.dto';

@ApiTags('assessments')
@ApiBearerAuth()
@Controller()
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  @Get('members/:memberId/assessments')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findByMember(@Param('memberId') memberId: string, @CurrentUser() user: AuthUser) {
    return this.assessmentService.findByMember(memberId, user);
  }

  @Post('members/:memberId/assessments')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(
    @Param('memberId') memberId: string,
    @Body() dto: CreateAssessmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assessmentService.create(memberId, dto, user);
  }
}
