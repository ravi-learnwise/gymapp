import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto, ReportQueryDto } from './dto/dashboard.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getSummary(@Query() query: DashboardQueryDto, @CurrentUser() user: AuthUser) {
    return this.dashboardService.getSummary(query, user);
  }

  @Get('reports')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getReport(@Query() query: ReportQueryDto, @CurrentUser() user: AuthUser) {
    return this.dashboardService.getReport(query, user);
  }
}
