import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DietPlanObjective } from '@prisma/client';
import { DietPlanDayDto } from './diet-plan.dto';

export class DietPlanTemplateQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean;

  @ApiPropertyOptional({ enum: DietPlanObjective })
  @IsOptional()
  @IsEnum(DietPlanObjective)
  objective?: DietPlanObjective;
}

export class CreateDietPlanTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ enum: DietPlanObjective })
  @IsOptional()
  @IsEnum(DietPlanObjective)
  objective?: DietPlanObjective;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hydrationGoal?: string;

  @ApiPropertyOptional({ type: [DietPlanDayDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanDayDto)
  days?: DietPlanDayDto[];
}

export class UpdateDietPlanTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ enum: DietPlanObjective })
  @IsOptional()
  @IsEnum(DietPlanObjective)
  objective?: DietPlanObjective;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hydrationGoal?: string;

  @ApiPropertyOptional({ type: [DietPlanDayDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanDayDto)
  days?: DietPlanDayDto[];
}
