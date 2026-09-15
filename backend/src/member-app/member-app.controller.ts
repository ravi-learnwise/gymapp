import { Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/roles.decorator';
import { CurrentMember } from './current-member.decorator';
import { MemberAuthGuard } from './member-auth.guard';
import { MemberAuthUser } from './member-auth.types';
import { MemberAppService } from './member-app.service';

@ApiTags('member-app')
@ApiBearerAuth()
@Public()
@UseGuards(MemberAuthGuard)
@Controller('member-app/me')
export class MemberAppController {
  constructor(private readonly members: MemberAppService) {}

  @Get()
  me(@CurrentMember() member: MemberAuthUser) {
    return this.members.getMe(member.id);
  }

  @Get('dashboard')
  dashboard(@CurrentMember() member: MemberAuthUser) {
    return this.members.getDashboard(member.id);
  }

  @Get('training')
  training(@CurrentMember() member: MemberAuthUser) {
    return this.members.getTraining(member.id);
  }

  @Get('diet')
  diet(@CurrentMember() member: MemberAuthUser) {
    return this.members.getDiet(member.id);
  }

  @Get('memberships')
  memberships(@CurrentMember() member: MemberAuthUser) {
    return this.members.getMemberships(member.id);
  }

  @Get('payments')
  payments(@CurrentMember() member: MemberAuthUser) {
    return this.members.getPayments(member.id);
  }

  @Get('assessments')
  assessments(@CurrentMember() member: MemberAuthUser) {
    return this.members.getAssessments(member.id);
  }

  @Get('attendance')
  attendance(@CurrentMember() member: MemberAuthUser) {
    return this.members.getAttendance(member.id);
  }

  @Post('attendance/check-in')
  checkIn(@CurrentMember() member: MemberAuthUser) {
    return this.members.checkIn(member.id);
  }

  @Patch('attendance/check-out')
  checkOut(@CurrentMember() member: MemberAuthUser) {
    return this.members.checkOut(member.id);
  }
}
