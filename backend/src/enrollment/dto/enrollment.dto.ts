import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender, MembershipStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsString()
  enquiryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dietType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sportsParticipation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fitnessGoals?: string;

  @ApiProperty()
  @IsString()
  programId!: string;

  @ApiProperty()
  @IsString()
  programDurationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTrial?: boolean;

  @ApiProperty()
  @IsDateString()
  startDate!: string;
}

export class MemberQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  membershipStatus?: MembershipStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class ExpiringMembershipQueryDto {
  @ApiPropertyOptional({ enum: ['7', '15', '30', 'beyond'] })
  @IsOptional()
  @IsIn(['7', '15', '30', 'beyond'])
  bucket?: '7' | '15' | '30' | 'beyond';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class UpdateMemberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

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
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dietType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sportsParticipation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fitnessGoals?: string;
}
