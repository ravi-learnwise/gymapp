import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { TrainingCardDayDto } from './dto/training-card.dto';
import {
  CreateTrainingPlanTemplateDto,
  TrainingPlanTemplateQueryDto,
  UpdateTrainingPlanTemplateDto,
} from './dto/training-plan-template.dto';

const templateInclude = {
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  days: {
    orderBy: { weekday: 'asc' as const },
    include: {
      exercises: {
        orderBy: { displayOrder: 'asc' as const },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: 'asc' as const } },
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
      _count: { select: { exercises: true } },
    },
  },
};

@Injectable()
export class TrainingPlanTemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: TrainingPlanTemplateQueryDto) {
    const where: Prisma.TrainingPlanTemplateWhereInput = {};
    if (query.activeOnly) where.isActive = true;
    if (query.search?.trim()) {
      where.name = { contains: query.search.trim() };
    }
    return this.prisma.trainingPlanTemplate.findMany({
      where,
      include: listInclude,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.trainingPlanTemplate.findUnique({
      where: { id },
      include: templateInclude,
    });
    if (!template) throw new NotFoundException('Training plan template not found');
    return template;
  }

  async create(dto: CreateTrainingPlanTemplateDto, user: AuthUser) {
    const daysInput = dto.days?.length ? dto.days : this.defaultDayDtos();
    return this.prisma.trainingPlanTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdById: user.id,
        updatedById: user.id,
        days: { create: daysInput.map((d) => this.buildDayCreate(d)) },
      },
      include: templateInclude,
    });
  }

  async update(id: string, dto: UpdateTrainingPlanTemplateDto, user: AuthUser) {
    await this.findOne(id);

    if (dto.days) {
      await this.prisma.trainingPlanTemplateDay.deleteMany({ where: { templateId: id } });
      for (const d of dto.days) {
        await this.prisma.trainingPlanTemplateDay.create({
          data: {
            templateId: id,
            ...this.buildDayCreate(d),
          },
        });
      }
    }

    return this.prisma.trainingPlanTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        updatedById: user.id,
      },
      include: templateInclude,
    });
  }

  async deactivate(id: string, user: AuthUser) {
    await this.findOne(id);
    return this.prisma.trainingPlanTemplate.update({
      where: { id },
      data: { isActive: false, updatedById: user.id },
      include: templateInclude,
    });
  }

  private defaultDayDtos(): TrainingCardDayDto[] {
    return Array.from({ length: 7 }, (_, weekday) => ({ weekday, exercises: [] }));
  }

  private buildDayCreate(d: TrainingCardDayDto) {
    return {
      weekday: d.weekday,
      dayType: d.dayType,
      notes: d.notes,
      displayOrder: d.displayOrder ?? d.weekday,
      exercises: d.exercises?.length
        ? {
            create: d.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sectionName: ex.sectionName,
              displayOrder: ex.displayOrder ?? 0,
              restSeconds: ex.restSeconds,
              notes: ex.notes,
              sets: ex.sets?.length
                ? {
                    create: ex.sets.map((s) => ({
                      setNumber: s.setNumber,
                      repMin: s.repMin,
                      repMax: s.repMax,
                      weight: s.weight,
                      weightUnit: s.weightUnit,
                      durationSeconds: s.durationSeconds,
                      notes: s.notes,
                    })),
                  }
                : undefined,
            })),
          }
        : undefined,
    };
  }
}
