import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EnquiryStatus, Gender, LeadSource } from '@prisma/client';
import { IsIndianMobile, IsIndianMobileRequired } from '../../common/validators/indian-mobile.validator';

export class CreateEnquiryDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyDetails?: string;

  @ApiProperty()
  @IsString()
  @IsIndianMobileRequired()
  mobileNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIndianMobile()
  alternateContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty()
  @IsDateString()
  dateOfEnquiry!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredContactTime?: string;

  @ApiProperty({ enum: LeadSource })
  @IsEnum(LeadSource)
  leadSource!: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offeredProgramId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offeredProgramDurationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offeredDiscountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offeredFlatDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offerCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  offerValidTill?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  initialNote?: string;
}

export class UpdateEnquiryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIndianMobileRequired()
  mobileNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIndianMobile()
  alternateContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfEnquiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredContactTime?: string;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  leadSource?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offeredProgramId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offeredProgramDurationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offeredDiscountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offeredFlatDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offerCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  offerValidTill?: string;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: EnquiryStatus })
  @IsEnum(EnquiryStatus)
  status!: EnquiryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  content!: string;
}

export class CreateReminderDto {
  @ApiProperty()
  @IsDateString()
  remindAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateReminderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  remindAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class EnquiryStatsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class EnquiryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: EnquiryStatus })
  @IsOptional()
  @IsEnum(EnquiryStatus)
  status?: EnquiryStatus;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  leadSource?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

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
