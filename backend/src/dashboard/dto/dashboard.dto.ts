import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  FINANCIAL = 'financial',
  ENQUIRIES = 'enquiries',
  ENROLLMENTS = 'enrollments',
  PAYMENTS = 'payments',
  ATTENDANCE = 'attendance',
  REFERRALS = 'referrals',
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsOptional()
  @IsString()
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export class ReportQueryDto extends DashboardQueryDto {
  @ApiPropertyOptional({ enum: ReportType })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;
}
