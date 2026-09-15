import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DietPlanStatus,
  DietPlanMeal,
  DietPlanDay,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { assertMemberAccess } from '../common/utils/member-access.util';
import {
  CopyDayDto,
  CopyMealDto,
  CreateDietPlanDto,
  DietPlanDayDto,
  PublishDietPlanDto,
  ReviseDietPlanDto,
  UpdateDietPlanDto,
} from './dto/diet-plan.dto';

const planInclude = {
  member: { select: { id: true, memberNumber: true, fullName: true, dietType: true, allergies: true, medicalHistory: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
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
  previousVersion: { select: { id: true, version: true, status: true } },
};

type MealWithFoods = Prisma.DietPlanMealGetPayload<{
  include: {
    foods: { include: { alternatives: true } };
  };
}>;

@Injectable()
export class DietPlanService {
  constructor(private prisma: PrismaService) {}

  private async assertWriteAccess(memberId: string, user: AuthUser) {
    await assertMemberAccess(this.prisma, memberId, user);
  }

  async findDueReviews() {
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);

    return this.prisma.dietPlan.findMany({
      where: {
        status: DietPlanStatus.ACTIVE,
        reviewDate: { lte: weekAhead },
      },
      include: {
        member: { select: { id: true, memberNumber: true, fullName: true } },
      },
      orderBy: { reviewDate: 'asc' },
    });
  }

  async findByMember(memberId: string, user: AuthUser) {
    await assertMemberAccess(this.prisma, memberId, user);
    return this.prisma.dietPlan.findMany({
      where: { memberId },
      include: {
        createdBy: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: [{ version: 'desc' }],
    });
  }

  async findActiveByMember(memberId: string, user: AuthUser) {
    await assertMemberAccess(this.prisma, memberId, user);
    const plan = await this.prisma.dietPlan.findFirst({
      where: { memberId, status: DietPlanStatus.ACTIVE },
      include: planInclude,
    });
    if (!plan) throw new NotFoundException('No active diet plan');
    return plan;
  }

  async findOne(id: string, user: AuthUser) {
    const plan = await this.prisma.dietPlan.findUnique({
      where: { id },
      include: planInclude,
    });
    if (!plan) throw new NotFoundException('Diet plan not found');
    await assertMemberAccess(this.prisma, plan.memberId, user);
    return plan;
  }

  async getVersions(id: string, user: AuthUser) {
    const plan = await this.findOne(id, user);
    const ancestors: typeof plan[] = [];
    let current = plan;
    while (current.previousVersionId) {
      const prev = await this.prisma.dietPlan.findUnique({
        where: { id: current.previousVersionId },
        include: planInclude,
      });
      if (!prev) break;
      ancestors.unshift(prev);
      current = prev;
    }
    const descendants = await this.prisma.dietPlan.findMany({
      where: { previousVersionId: plan.id },
      include: planInclude,
    });
    return { plan, ancestors, descendants };
  }

  async create(dto: CreateDietPlanDto, user: AuthUser) {
    await this.assertWriteAccess(dto.memberId, user);

    const latest = await this.prisma.dietPlan.findFirst({
      where: { memberId: dto.memberId },
      orderBy: { version: 'desc' },
    });

    const daysInput = dto.days?.length ? dto.days : this.defaultDayDtos();

    return this.prisma.dietPlan.create({
      data: {
        memberId: dto.memberId,
        name: dto.name,
        objective: dto.objective,
        description: dto.description,
        hydrationGoal: dto.hydrationGoal,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
        sourceTemplateId: dto.sourceTemplateId,
        version: (latest?.version ?? 0) + 1,
        status: DietPlanStatus.DRAFT,
        createdById: user.id,
        updatedById: user.id,
        days: { create: daysInput.map((d) => this.buildDayCreate(d)) },
      },
      include: planInclude,
    });
  }

  async update(id: string, dto: UpdateDietPlanDto, user: AuthUser) {
    const existing = await this.findOne(id, user);
    await this.assertWriteAccess(existing.memberId, user);

    if (existing.status !== DietPlanStatus.DRAFT) {
      if (dto.sourceTemplateId === undefined) {
        throw new BadRequestException('Only draft plans can be edited');
      }
      return this.prisma.dietPlan.update({
        where: { id },
        data: { sourceTemplateId: dto.sourceTemplateId, updatedById: user.id },
        include: planInclude,
      });
    }

    if (dto.days) {
      await this.prisma.dietPlanDay.deleteMany({ where: { dietPlanId: id } });
      for (const d of dto.days) {
        await this.prisma.dietPlanDay.create({
          data: {
            dietPlanId: id,
            ...this.buildDayCreate(d),
          },
        });
      }
    }

    return this.prisma.dietPlan.update({
      where: { id },
      data: {
        name: dto.name,
        objective: dto.objective,
        description: dto.description,
        hydrationGoal: dto.hydrationGoal,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
        sourceTemplateId: dto.sourceTemplateId,
        updatedById: user.id,
      },
      include: planInclude,
    });
  }

  async publish(id: string, dto: PublishDietPlanDto, user: AuthUser) {
    const plan = await this.findOne(id, user);
    if (plan.status !== DietPlanStatus.DRAFT) {
      throw new BadRequestException('Only draft plans can be published');
    }
    await this.assertWriteAccess(plan.memberId, user);

    const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.dietPlan.updateMany({
        where: { memberId: plan.memberId, status: DietPlanStatus.ACTIVE },
        data: { status: DietPlanStatus.SUPERSEDED },
      });

      return tx.dietPlan.update({
        where: { id },
        data: {
          status: DietPlanStatus.ACTIVE,
          effectiveFrom,
          updatedById: user.id,
        },
        include: planInclude,
      });
    });
  }

  async revise(id: string, dto: ReviseDietPlanDto, user: AuthUser) {
    const source = await this.findOne(id, user);
    await this.assertWriteAccess(source.memberId, user);

    const clone = await this.prisma.dietPlan.create({
      data: {
        memberId: source.memberId,
        name: dto.name ?? source.name,
        objective: source.objective,
        description: source.description,
        hydrationGoal: source.hydrationGoal,
        reviewDate: source.reviewDate,
        version: source.version + 1,
        status: DietPlanStatus.DRAFT,
        previousVersionId: source.id,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    for (const day of source.days) {
      await this.cloneDayContent(day, clone.id);
    }

    return this.findOne(clone.id, user);
  }

  async archive(id: string, user: AuthUser) {
    const plan = await this.findOne(id, user);
    if (user.role === UserRole.TRAINER) {
      throw new ForbiddenException('Trainers cannot archive diet plans');
    }
    await this.assertWriteAccess(plan.memberId, user);

    return this.prisma.dietPlan.update({
      where: { id },
      data: { status: DietPlanStatus.ARCHIVED, updatedById: user.id },
      include: planInclude,
    });
  }

  async copyDay(planId: string, sourceWeekday: number, dto: CopyDayDto, user: AuthUser) {
    const plan = await this.findOne(planId, user);
    if (plan.status !== DietPlanStatus.DRAFT) {
      throw new BadRequestException('Only draft plans can be edited');
    }
    await this.assertWriteAccess(plan.memberId, user);

    const sourceDay = plan.days.find((d) => d.weekday === sourceWeekday);
    if (!sourceDay) throw new NotFoundException('Source day not found');

    const replaceExisting = dto.replaceExisting ?? false;

    for (const targetWeekday of dto.targetWeekdays) {
      if (targetWeekday === sourceWeekday) continue;

      const targetDay = plan.days.find((d) => d.weekday === targetWeekday);
      if (!targetDay) continue;

      if (targetDay.meals.length > 0 && !replaceExisting) {
        throw new ConflictException(
          `Weekday ${targetWeekday} already has meals. Set replaceExisting=true to replace.`,
        );
      }

      await this.prisma.dietPlanMeal.deleteMany({ where: { dayId: targetDay.id } });
      await this.cloneDayContent(sourceDay, planId, targetDay.id);
    }

    return this.findOne(planId, user);
  }

  async copyMeal(mealId: string, dto: CopyMealDto, user: AuthUser) {
    const sourceMeal = await this.prisma.dietPlanMeal.findUnique({
      where: { id: mealId },
      include: {
        foods: { include: { alternatives: true }, orderBy: { displayOrder: 'asc' } },
        day: { include: { dietPlan: true } },
      },
    });
    if (!sourceMeal) throw new NotFoundException('Meal not found');

    const plan = await this.findOne(sourceMeal.day.dietPlanId, user);
    if (plan.status !== DietPlanStatus.DRAFT) {
      throw new BadRequestException('Only draft plans can be edited');
    }

    const replaceExisting = dto.replaceExisting ?? false;

    for (const targetWeekday of dto.targetWeekdays) {
      const targetDay = plan.days.find((d) => d.weekday === targetWeekday);
      if (!targetDay || targetDay.id === sourceMeal.dayId) continue;

      if (replaceExisting) {
        await this.prisma.dietPlanMeal.deleteMany({
          where: { dayId: targetDay.id, mealType: sourceMeal.mealType },
        });
      }

      await this.cloneMealContent(sourceMeal, targetDay.id);
    }

    return this.findOne(plan.id, user);
  }

  private async cloneDayContent(
    sourceDay: DietPlanDay & { meals: MealWithFoods[] },
    dietPlanId: string,
    existingDayId?: string,
  ) {
    let dayId = existingDayId;
    if (!dayId) {
      const created = await this.prisma.dietPlanDay.create({
        data: {
          dietPlanId,
          weekday: sourceDay.weekday,
          dayType: sourceDay.dayType,
          notes: sourceDay.notes,
          displayOrder: sourceDay.displayOrder,
        },
      });
      dayId = created.id;
    } else {
      await this.prisma.dietPlanDay.update({
        where: { id: dayId },
        data: {
          dayType: sourceDay.dayType,
          notes: sourceDay.notes,
          displayOrder: sourceDay.displayOrder,
        },
      });
    }

    for (const meal of sourceDay.meals) {
      await this.cloneMealContent(meal, dayId);
    }
  }

  private async cloneMealContent(meal: MealWithFoods, targetDayId: string) {
    const newMeal = await this.prisma.dietPlanMeal.create({
      data: {
        dayId: targetDayId,
        mealType: meal.mealType,
        title: meal.title,
        approximateTime: meal.approximateTime,
        timingNote: meal.timingNote,
        notes: meal.notes,
        displayOrder: meal.displayOrder,
      },
    });

    for (const food of meal.foods) {
      const newFood = await this.prisma.dietPlanFoodItem.create({
        data: {
          mealId: newMeal.id,
          foodName: food.foodName,
          quantity: food.quantity,
          unit: food.unit,
          preparation: food.preparation,
          notes: food.notes,
          displayOrder: food.displayOrder,
        },
      });

      if (food.alternatives.length) {
        await this.prisma.dietFoodAlternative.createMany({
          data: food.alternatives.map((alt) => ({
            foodItemId: newFood.id,
            alternativeFoodName: alt.alternativeFoodName,
            quantity: alt.quantity,
            unit: alt.unit,
            notes: alt.notes,
            displayOrder: alt.displayOrder,
          })),
        });
      }
    }
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
