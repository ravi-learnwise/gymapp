import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CheckInDto {
  @ApiProperty()
  @IsUUID()
  memberId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch?: string;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class AttendanceAnalyticsQueryDto {
  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsOptional()
  @IsString()
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
