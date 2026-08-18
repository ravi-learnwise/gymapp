import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TrainingCardStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { assertMemberAccess } from '../common/utils/member-access.util';
import {
  CreateTrainingCardDto,
  PublishTrainingCardDto,
  ReviseTrainingCardDto,
  TrainingCardDayDto,
  UpdateTrainingCardDto,
} from './dto/training-card.dto';

const cardInclude = {
  member: { select: { id: true, memberNumber: true, fullName: true } },
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
  previousVersion: { select: { id: true, version: true, status: true } },
};

@Injectable()
export class TrainingCardService {
  constructor(private prisma: PrismaService) {}

  private async assertWriteAccess(memberId: string, user: AuthUser) {
    await assertMemberAccess(this.prisma, memberId, user);
  }

  async findDueReviews() {
    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);

    return this.prisma.trainingCard.findMany({
      where: {
        status: TrainingCardStatus.ACTIVE,
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
    return this.prisma.trainingCard.findMany({
      where: { memberId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ version: 'desc' }],
    });
  }

  async findActiveByMember(memberId: string, user: AuthUser) {
    await assertMemberAccess(this.prisma, memberId, user);
    const card = await this.prisma.trainingCard.findFirst({
      where: { memberId, status: TrainingCardStatus.ACTIVE },
      include: cardInclude,
    });
    if (!card) throw new NotFoundException('No active training card');
    return card;
  }

  async findOne(id: string, user: AuthUser) {
    const card = await this.prisma.trainingCard.findUnique({
      where: { id },
      include: cardInclude,
    });
    if (!card) throw new NotFoundException('Training card not found');
    await assertMemberAccess(this.prisma, card.memberId, user);
    return card;
  }

  async getVersions(id: string, user: AuthUser) {
    const card = await this.findOne(id, user);
    const versions: typeof card[] = [];
    let current = card;
    while (current.previousVersionId) {
      const prev = await this.prisma.trainingCard.findUnique({
        where: { id: current.previousVersionId },
        include: cardInclude,
      });
      if (!prev) break;
      versions.unshift(prev);
      current = prev;
    }
    const newer = await this.prisma.trainingCard.findMany({
      where: { previousVersionId: card.id },
      include: cardInclude,
    });
    return { card, ancestors: versions, descendants: newer };
  }

  async create(dto: CreateTrainingCardDto, user: AuthUser) {
    await this.assertWriteAccess(dto.memberId, user);

    const latest = await this.prisma.trainingCard.findFirst({
      where: { memberId: dto.memberId },
      orderBy: { version: 'desc' },
    });

    const daysInput = dto.days?.length ? dto.days : this.defaultDayDtos();

    return this.prisma.trainingCard.create({
      data: {
        memberId: dto.memberId,
        name: dto.name,
        description: dto.description,
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
        version: (latest?.version ?? 0) + 1,
        status: TrainingCardStatus.DRAFT,
        createdById: user.id,
        updatedById: user.id,
        days: { create: daysInput.map((d) => this.buildDayCreate(d)) },
      },
      include: cardInclude,
    });
  }

  async update(id: string, dto: UpdateTrainingCardDto, user: AuthUser) {
    const existing = await this.findOne(id, user);
    if (existing.status !== TrainingCardStatus.DRAFT) {
      throw new BadRequestException('Only draft cards can be edited');
    }
    await this.assertWriteAccess(existing.memberId, user);

    if (dto.days) {
      await this.prisma.trainingCardDay.deleteMany({ where: { trainingCardId: id } });
      await this.prisma.trainingCardDay.createMany({
        data: dto.days.map((d) => ({
          trainingCardId: id,
          weekday: d.weekday,
          dayType: d.dayType ?? 'NOT_ASSIGNED',
          notes: d.notes,
          displayOrder: d.displayOrder ?? d.weekday,
        })),
      });
      for (const d of dto.days) {
        if (!d.exercises?.length) continue;
        const day = await this.prisma.trainingCardDay.findFirst({
          where: { trainingCardId: id, weekday: d.weekday },
        });
        if (!day) continue;
        for (const ex of d.exercises) {
          const createdEx = await this.prisma.trainingCardExercise.create({
            data: {
              dayId: day.id,
              exerciseId: ex.exerciseId,
              sectionName: ex.sectionName,
              displayOrder: ex.displayOrder ?? 0,
              restSeconds: ex.restSeconds,
              notes: ex.notes,
            },
          });
          if (ex.sets?.length) {
            await this.prisma.trainingCardSet.createMany({
              data: ex.sets.map((s) => ({
                trainingCardExerciseId: createdEx.id,
                setNumber: s.setNumber,
                repMin: s.repMin,
                repMax: s.repMax,
                weight: s.weight,
                weightUnit: s.weightUnit,
                durationSeconds: s.durationSeconds,
                notes: s.notes,
              })),
            });
          }
        }
      }
    }

    return this.prisma.trainingCard.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
        updatedById: user.id,
      },
      include: cardInclude,
    });
  }

  async publish(id: string, dto: PublishTrainingCardDto, user: AuthUser) {
    const card = await this.findOne(id, user);
    if (card.status !== TrainingCardStatus.DRAFT) {
      throw new BadRequestException('Only draft cards can be published');
    }
    await this.assertWriteAccess(card.memberId, user);

    const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.trainingCard.updateMany({
        where: {
          memberId: card.memberId,
          status: TrainingCardStatus.ACTIVE,
        },
        data: { status: TrainingCardStatus.SUPERSEDED },
      });

      return tx.trainingCard.update({
        where: { id },
        data: {
          status: TrainingCardStatus.ACTIVE,
          effectiveFrom,
          updatedById: user.id,
        },
        include: cardInclude,
      });
    });
  }

  async revise(id: string, dto: ReviseTrainingCardDto, user: AuthUser) {
    const source = await this.findOne(id, user);
    await this.assertWriteAccess(source.memberId, user);

    const clone = await this.prisma.trainingCard.create({
      data: {
        memberId: source.memberId,
        name: dto.name ?? source.name,
        description: source.description,
        reviewDate: source.reviewDate,
        version: source.version + 1,
        status: TrainingCardStatus.DRAFT,
        previousVersionId: source.id,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    for (const day of source.days) {
      const newDay = await this.prisma.trainingCardDay.create({
        data: {
          trainingCardId: clone.id,
          weekday: day.weekday,
          dayType: day.dayType,
          notes: day.notes,
          displayOrder: day.displayOrder,
        },
      });
      for (const ex of day.exercises) {
        const newEx = await this.prisma.trainingCardExercise.create({
          data: {
            dayId: newDay.id,
            exerciseId: ex.exerciseId,
            sectionName: ex.sectionName,
            displayOrder: ex.displayOrder,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
          },
        });
        if (ex.sets.length) {
          await this.prisma.trainingCardSet.createMany({
            data: ex.sets.map((s) => ({
              trainingCardExerciseId: newEx.id,
              setNumber: s.setNumber,
              repMin: s.repMin,
              repMax: s.repMax,
              weight: s.weight,
              weightUnit: s.weightUnit,
              durationSeconds: s.durationSeconds,
              notes: s.notes,
            })),
          });
        }
      }
    }

    return this.findOne(clone.id, user);
  }

  async archive(id: string, user: AuthUser) {
    const card = await this.findOne(id, user);
    if (user.role === UserRole.TRAINER) {
      throw new ForbiddenException('Trainers cannot archive training cards');
    }
    await this.assertWriteAccess(card.memberId, user);

    return this.prisma.trainingCard.update({
      where: { id },
      data: { status: TrainingCardStatus.ARCHIVED, updatedById: user.id },
      include: cardInclude,
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
