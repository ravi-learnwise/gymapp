import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EnquiryStatus, Gender, LeadSource } from '@prisma/client';

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
  @MinLength(10)
  mobileNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
  offeredDiscountId?: string;

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
  mobileNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
  offeredDiscountId?: string;

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
