import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import {
  AttendanceAnalyticsQueryDto,
  AttendanceQueryDto,
  CheckInDto,
} from './dto/attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get('enabled')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  isEnabled() {
    return this.attendanceService.isEnabled();
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findAll(@Query() query: AttendanceQueryDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.findAll(query, user);
  }

  @Get('analytics')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getAnalytics(@Query() query: AttendanceAnalyticsQueryDto) {
    return this.attendanceService.getAnalytics(query);
  }

  @Post('check-in')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.checkIn(dto, user);
  }

  @Patch(':id/check-out')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  checkOut(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.attendanceService.checkOut(id, user);
  }
}
