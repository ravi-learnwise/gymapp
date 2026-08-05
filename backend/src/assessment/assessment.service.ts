import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { assertMemberAccess } from '../common/utils/member-access.util';
import { calculateBmi } from '../enrollment/bmi.util';
import { CreateAssessmentDto } from './dto/assessment.dto';

const assessmentInclude = {
  assessedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
};

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  async findByMember(memberId: string, user: AuthUser) {
    await assertMemberAccess(this.prisma, memberId, user);

    return this.prisma.fitnessAssessment.findMany({
      where: { memberId },
      include: assessmentInclude,
      orderBy: { assessedAt: 'desc' },
    });
  }

  async create(memberId: string, dto: CreateAssessmentDto, user: AuthUser) {
    if (user.role === UserRole.TRAINER) {
      throw new ForbiddenException('Trainers cannot record assessments');
    }

    await assertMemberAccess(this.prisma, memberId, user);

    const bmi =
      dto.height && dto.weight ? calculateBmi(dto.height, dto.weight) : undefined;

    const assessment = await this.prisma.fitnessAssessment.create({
      data: {
        memberId,
        height: dto.height,
        weight: dto.weight,
        bmi,
        bodyFat: dto.bodyFat,
        waist: dto.waist,
        chest: dto.chest,
        hip: dto.hip,
        arm: dto.arm,
        thigh: dto.thigh,
        medicalHistory: dto.medicalHistory,
        fitnessGoals: dto.fitnessGoals,
        notes: dto.notes,
        assessedAt: dto.assessedAt ? new Date(dto.assessedAt) : undefined,
        assessedById: user.id,
      },
      include: assessmentInclude,
    });

    if (dto.height || dto.weight || dto.medicalHistory || dto.fitnessGoals) {
      await this.prisma.member.update({
        where: { id: memberId },
        data: {
          height: dto.height,
          weight: dto.weight,
          bmi,
          medicalHistory: dto.medicalHistory,
          fitnessGoals: dto.fitnessGoals,
        },
      });
    }

    return assessment;
  }

  async createFromEnrollment(
    memberId: string,
    data: {
      height?: number;
      weight?: number;
      medicalHistory?: string;
      fitnessGoals?: string;
    },
    assessedById: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (!data.height && !data.weight && !data.medicalHistory && !data.fitnessGoals) {
      return null;
    }

    const bmi =
      data.height && data.weight ? calculateBmi(data.height, data.weight) : undefined;

    const client = tx ?? this.prisma;
    return client.fitnessAssessment.create({
      data: {
        memberId,
        height: data.height,
        weight: data.weight,
        bmi,
        medicalHistory: data.medicalHistory,
        fitnessGoals: data.fitnessGoals,
        notes: 'Initial assessment at enrollment',
        assessedById,
      },
    });
  }
}
