import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExerciseType } from '@prisma/client';

export class CreateExerciseDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyPart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryMuscle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryMuscles?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  muscleGroups?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipment?: string;

  @ApiPropertyOptional({ enum: ExerciseType })
  @IsOptional()
  @IsEnum(ExerciseType)
  type?: ExerciseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technique?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  safetyNotes?: string;
}

export class UpdateExerciseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyPart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryMuscle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryMuscles?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  muscleGroups?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipment?: string;

  @ApiPropertyOptional({ enum: ExerciseType })
  @IsOptional()
  @IsEnum(ExerciseType)
  type?: ExerciseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technique?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  safetyNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ExerciseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyPart?: string;
}
