import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { DietPlanDayDto } from './dto/diet-plan.dto';
import {
  CreateDietPlanTemplateDto,
  DietPlanTemplateQueryDto,
  UpdateDietPlanTemplateDto,
} from './dto/diet-plan-template.dto';

const templateInclude = {
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  days: {
    orderBy: { weekday: 'asc' as const },
    include: {
      meals: {
        orderBy: { displayOrder: 'asc' as const },
        include: {
          foods: {
            orderBy: { displayOrder: 'asc' as const },
            include: {
              alternatives: { orderBy: { displayOrder: 'asc' as const } },
            },
          },
        },
      },
    },
  },
};

const listInclude = {
  createdBy: { select: { firstName: true, lastName: true } },
  days: {
    orderBy: { weekday: 'asc' as const },
    select: {
      weekday: true,
      dayType: true,
      _count: { select: { meals: true } },
    },
  },
};

@Injectable()
export class DietPlanTemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: DietPlanTemplateQueryDto) {
    const where: Prisma.DietPlanTemplateWhereInput = {};
    if (query.activeOnly) where.isActive = true;
    if (query.objective) where.objective = query.objective;
    if (query.search?.trim()) {
      where.name = { contains: query.search.trim() };
    }
    return this.prisma.dietPlanTemplate.findMany({
      where,
      include: listInclude,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.dietPlanTemplate.findUnique({
      where: { id },
      include: templateInclude,
    });
    if (!template) throw new NotFoundException('Diet plan template not found');
    return template;
  }

  async create(dto: CreateDietPlanTemplateDto, user: AuthUser) {
    const daysInput = dto.days?.length ? dto.days : this.defaultDayDtos();
    return this.prisma.dietPlanTemplate.create({
      data: {
        name: dto.name,
        objective: dto.objective,
        description: dto.description,
        hydrationGoal: dto.hydrationGoal,
        createdById: user.id,
        updatedById: user.id,
        days: { create: daysInput.map((d) => this.buildDayCreate(d)) },
      },
      include: templateInclude,
    });
  }

  async update(id: string, dto: UpdateDietPlanTemplateDto, user: AuthUser) {
    await this.findOne(id);

    if (dto.days) {
      await this.prisma.dietPlanTemplateDay.deleteMany({ where: { templateId: id } });
      for (const d of dto.days) {
        await this.prisma.dietPlanTemplateDay.create({
          data: {
            templateId: id,
            ...this.buildDayCreate(d),
          },
        });
      }
    }

    return this.prisma.dietPlanTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        objective: dto.objective,
        description: dto.description,
        hydrationGoal: dto.hydrationGoal,
        updatedById: user.id,
      },
      include: templateInclude,
    });
  }

  async deactivate(id: string, user: AuthUser) {
    await this.findOne(id);
    return this.prisma.dietPlanTemplate.update({
      where: { id },
      data: { isActive: false, updatedById: user.id },
      include: templateInclude,
    });
  }

  private defaultDayDtos(): DietPlanDayDto[] {
    return Array.from({ length: 7 }, (_, weekday) => ({ weekday, meals: [] }));
  }

  private buildDayCreate(d: DietPlanDayDto) {
    return {
      weekday: d.weekday,
      dayType: d.dayType,
      notes: d.notes,
      displayOrder: d.displayOrder ?? d.weekday,
      meals: d.meals?.length
        ? {
            create: d.meals.map((meal, mi) => ({
              mealType: meal.mealType,
              title: meal.title,
              approximateTime: meal.approximateTime,
              timingNote: meal.timingNote,
              notes: meal.notes,
              displayOrder: meal.displayOrder ?? mi,
              foods: meal.foods?.length
                ? {
                    create: meal.foods.map((food, fi) => ({
                      foodName: food.foodName,
                      quantity: food.quantity,
                      unit: food.unit,
                      preparation: food.preparation,
                      notes: food.notes,
                      displayOrder: food.displayOrder ?? fi,
                      alternatives: food.alternatives?.length
                        ? {
                            create: food.alternatives.map((alt, ai) => ({
                              alternativeFoodName: alt.alternativeFoodName,
                              quantity: alt.quantity,
                              unit: alt.unit,
                              notes: alt.notes,
                              displayOrder: alt.displayOrder ?? ai,
                            })),
                          }
                        : undefined,
                    })),
                  }
                : undefined,
            })),
          }
        : undefined,
    };
  }
}
