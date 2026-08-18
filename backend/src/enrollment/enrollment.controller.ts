import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto, ExpiringMembershipQueryDto, MemberQueryDto, UpdateMemberDto, AddMembershipDto } from './dto/enrollment.dto';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller()
export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  @Get('programs')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  getPrograms() {
    return this.enrollmentService.getPrograms();
  }

  @Get('enrollments/prefill/:enquiryId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getPrefill(@Param('enquiryId') enquiryId: string) {
    return this.enrollmentService.getPrefill(enquiryId);
  }

  @Get('enrollments/trainers')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  getTrainers() {
    return this.enrollmentService.getTrainers();
  }

  @Get('enrollments/stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getStats() {
    return this.enrollmentService.getStats();
  }

  @Post('enrollments')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() dto: CreateEnrollmentDto, @CurrentUser() user: AuthUser) {
    return this.enrollmentService.create(dto, user.id);
  }

  @Get('enrollments')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findAllEnrollments() {
    return this.enrollmentService.findAllEnrollments();
  }

  @Get('enrollments/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findOneEnrollment(@Param('id') id: string) {
    return this.enrollmentService.findOneEnrollment(id);
  }

  @Get('memberships/expiring')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getExpiringMemberships(@Query() query: ExpiringMembershipQueryDto) {
    return this.enrollmentService.getExpiringMemberships(query);
  }

  @Get('members')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findAllMembers(@Query() query: MemberQueryDto, @CurrentUser() user: AuthUser) {
    return this.enrollmentService.findAllMembers(query, user);
  }

  @Get('members/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findOneMember(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.enrollmentService.findOneMember(id, user);
  }

  @Patch('members/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enrollmentService.updateMember(id, dto, user);
  }

  @Post('members/:id/memberships')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  addMembership(
    @Param('id') memberId: string,
    @Body() dto: AddMembershipDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enrollmentService.addMembership(memberId, dto, user);
  }
}
