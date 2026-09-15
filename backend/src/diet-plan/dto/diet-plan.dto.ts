import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DietDayType, DietPlanObjective, MealType } from '@prisma/client';

export class DietFoodAlternativeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  alternativeFoodName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class DietPlanFoodItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  foodName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preparation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ type: [DietFoodAlternativeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietFoodAlternativeDto)
  alternatives?: DietFoodAlternativeDto[];
}

export class DietPlanMealDto {
  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  mealType!: MealType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approximateTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timingNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ type: [DietPlanFoodItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanFoodItemDto)
  foods?: DietPlanFoodItemDto[];
}

export class DietPlanDayDto {
  @ApiProperty({ minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiPropertyOptional({ enum: DietDayType })
  @IsOptional()
  @IsEnum(DietDayType)
  dayType?: DietDayType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ type: [DietPlanMealDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanMealDto)
  meals?: DietPlanMealDto[];
}

export class CreateDietPlanDto {
  @ApiProperty()
  @IsString()
  memberId!: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceTemplateId?: string;

  @ApiPropertyOptional({ type: [DietPlanDayDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanDayDto)
  days?: DietPlanDayDto[];
}

export class UpdateDietPlanDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceTemplateId?: string;

  @ApiPropertyOptional({ type: [DietPlanDayDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanDayDto)
  days?: DietPlanDayDto[];
}

export class PublishDietPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}

export class ReviseDietPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class CopyDayDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  targetWeekdays!: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean;
}

export class CopyMealDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  targetWeekdays!: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean;
}
