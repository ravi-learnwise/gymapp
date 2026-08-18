import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnquiryStatus, MembershipStatus, Prisma, ProgramEnrollmentType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { assertMemberAccess } from '../common/utils/member-access.util';
import { sanitizeMemberForUser, sanitizeMemberListItem } from '../common/utils/member-view.util';
import { TERMINAL_STATUSES } from '../enquiry/enquiry-workflow';
import { AddMembershipDto, CreateEnrollmentDto, MemberQueryDto, UpdateMemberDto } from './dto/enrollment.dto';
import { addMonths, calculateBmi } from './bmi.util';
import { PaymentService } from '../payment/payment.service';
import { toNumber } from '../payment/payment.util';
import { AssessmentService } from '../assessment/assessment.service';

const memberInclude = {
  sourceEnquiry: { select: { id: true, enquiryNumber: true } },
  memberships: {
    include: {
      program: { select: { id: true, name: true, enrollmentType: true } },
      programDuration: { select: { id: true, label: true, months: true, price: true } },
      trainer: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { startDate: 'desc' as const },
  },
  enrollment: {
    select: {
      id: true,
      enrollmentNumber: true,
      enrolledAt: true,
      enrolledBy: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  },
};

@Injectable()
export class EnrollmentService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private assessmentService: AssessmentService,
  ) {}

  async getPrefill(enquiryId: string) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: {
        offeredProgram: {
          select: {
            id: true,
            name: true,
            durations: { where: { isActive: true }, orderBy: { months: 'asc' } },
          },
        },
        offeredProgramDuration: { select: { id: true, label: true, months: true, price: true } },
        offeredDiscount: { select: { id: true, name: true, percentage: true } },
        offerCategory: { select: { id: true, name: true } },
        enrollment: { select: { id: true, enrollmentNumber: true } },
      },
    });

    if (!enquiry) throw new NotFoundException('Enquiry not found');
    if (enquiry.enrollment) {
      throw new BadRequestException('Enquiry already has an enrollment');
    }
    if (TERMINAL_STATUSES.includes(enquiry.status)) {
      throw new BadRequestException('Cannot enroll a closed enquiry');
    }

    return {
      enquiry: {
        id: enquiry.id,
        enquiryNumber: enquiry.enquiryNumber,
        fullName: enquiry.fullName,
        age: enquiry.age,
        gender: enquiry.gender,
        profession: enquiry.profession,
        familyDetails: enquiry.familyDetails,
        mobileNumber: enquiry.mobileNumber,
        alternateContact: enquiry.alternateContact,
        email: enquiry.email,
        address: enquiry.address,
        leadSource: enquiry.leadSource,
        preferredContactTime: enquiry.preferredContactTime,
        dateOfEnquiry: enquiry.dateOfEnquiry,
        status: enquiry.status,
        offeredProgram: enquiry.offeredProgram,
        offeredProgramDuration: enquiry.offeredProgramDuration,
        offeredDiscount: enquiry.offeredDiscount,
        offeredFlatDiscount: enquiry.offeredFlatDiscount
          ? String(enquiry.offeredFlatDiscount)
          : null,
        offerCategory: enquiry.offerCategory,
        offerValidTill: enquiry.offerValidTill,
      },
      suggestedProgramId: enquiry.offeredProgramId,
      suggestedDurationId:
        enquiry.offeredProgramDurationId ??
        enquiry.offeredProgram?.durations[0]?.id ??
        null,
    };
  }

  async getTrainers() {
    return this.prisma.user.findMany({
      where: { role: UserRole.TRAINER, isActive: true },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  getPrograms() {
    return this.prisma.program.findMany({
      where: { isActive: true },
      include: { durations: { where: { isActive: true }, orderBy: { months: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateEnrollmentDto, userId: string) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id: dto.enquiryId },
      include: {
        enrollment: true,
        offeredDiscount: { select: { percentage: true } },
      },
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');
    if (enquiry.enrollment) {
      throw new BadRequestException('Enquiry already enrolled');
    }
    if (TERMINAL_STATUSES.includes(enquiry.status)) {
      throw new BadRequestException('Cannot enroll a closed enquiry');
    }

    const duration = await this.prisma.programDuration.findFirst({
      where: {
        id: dto.programDurationId,
        programId: dto.programId,
        isActive: true,
      },
    });
    if (!duration) {
      throw new BadRequestException('Invalid program or duration');
    }

    if (dto.trainerId) {
      const trainer = await this.prisma.user.findFirst({
        where: { id: dto.trainerId, role: UserRole.TRAINER, isActive: true },
      });
      if (!trainer) throw new BadRequestException('Invalid trainer');
    }

    const bmi =
      dto.height && dto.weight
        ? calculateBmi(dto.height, dto.weight)
        : undefined;

    const startDate = new Date(dto.startDate);
    const endDate = addMonths(startDate, duration.months);

    const memberNumber = await this.generateMemberNumber();
    const enrollmentNumber = await this.generateEnrollmentNumber();

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          memberNumber,
          fullName: enquiry.fullName,
          mobileNumber: enquiry.mobileNumber,
          alternateContact: enquiry.alternateContact,
          email: enquiry.email,
          address: enquiry.address,
          gender: enquiry.gender,
          profession: enquiry.profession,
          familyDetails: enquiry.familyDetails,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          height: dto.height,
          weight: dto.weight,
          bmi,
          medicalHistory: dto.medicalHistory,
          allergies: dto.allergies,
          dietType: dto.dietType,
          sportsParticipation: dto.sportsParticipation,
          fitnessGoals: dto.fitnessGoals,
          sourceEnquiryId: enquiry.id,
        },
      });

      await this.assessmentService.createFromEnrollment(
        member.id,
        {
          height: dto.height,
          weight: dto.weight,
          medicalHistory: dto.medicalHistory,
          fitnessGoals: dto.fitnessGoals,
        },
        userId,
        tx,
      );

      const membership = await tx.membership.create({
        data: {
          memberId: member.id,
          programId: dto.programId,
          programDurationId: dto.programDurationId,
          trainerId: dto.trainerId,
          isTrial: dto.isTrial ?? false,
          startDate,
          endDate,
        },
      });

      const discountPercent = enquiry.offeredDiscount?.percentage
        ? toNumber(enquiry.offeredDiscount.percentage)
        : null;
      const flatDiscount = enquiry.offeredFlatDiscount
        ? toNumber(enquiry.offeredFlatDiscount)
        : null;
      await this.paymentService.createCommitmentFromEnrollment(
        membership.id,
        member.id,
        toNumber(duration.price),
        discountPercent,
        tx,
        flatDiscount,
      );

      const enrollment = await tx.enrollment.create({
        data: {
          enrollmentNumber,
          enquiryId: enquiry.id,
          memberId: member.id,
          membershipId: membership.id,
          enrolledById: userId,
        },
        include: {
          member: { select: { id: true, memberNumber: true, fullName: true } },
          membership: {
            include: {
              program: { select: { id: true, name: true } },
              programDuration: { select: { id: true, label: true, months: true } },
              trainer: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          enquiry: { select: { id: true, enquiryNumber: true, status: true } },
        },
      });

      if (enquiry.status !== EnquiryStatus.CONVERTED) {
        await tx.enquiry.update({
          where: { id: enquiry.id },
          data: { status: EnquiryStatus.CONVERTED },
        });

        await tx.enquiryStatusHistory.create({
          data: {
            enquiryId: enquiry.id,
            fromStatus: enquiry.status,
            toStatus: EnquiryStatus.CONVERTED,
            changedById: userId,
          },
        });

        await tx.enquiryNote.create({
          data: {
            enquiryId: enquiry.id,
            content: `Converted via enrollment ${enrollmentNumber}`,
            createdById: userId,
          },
        });
      }

      return enrollment;
    });
  }

  async findAllEnrollments() {
    return this.prisma.enrollment.findMany({
      include: {
        member: { select: { id: true, memberNumber: true, fullName: true } },
        enquiry: { select: { id: true, enquiryNumber: true } },
        membership: {
          include: {
            program: { select: { name: true } },
            trainer: { select: { firstName: true, lastName: true } },
          },
        },
        enrolledBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async findOneEnrollment(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        member: { include: memberInclude },
        enquiry: {
          select: {
            id: true,
            enquiryNumber: true,
            fullName: true,
            mobileNumber: true,
            status: true,
          },
        },
        membership: {
          include: {
            program: true,
            programDuration: true,
            trainer: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        enrolledBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async findAllMembers(query: MemberQueryDto, user: AuthUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {};

    if (user.role === UserRole.TRAINER) {
      where.memberships = { some: { trainerId: user.id, status: 'ACTIVE' } };
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s } },
        { mobileNumber: { contains: s } },
        { memberNumber: { contains: s } },
        { email: { contains: s } },
      ];
    }

    if (query.membershipStatus) {
      where.memberships = {
        some: {
          status: query.membershipStatus,
          ...(user.role === UserRole.TRAINER ? { trainerId: user.id } : {}),
        },
      };
    }

    const memberSortFields: Record<string, keyof Prisma.MemberOrderByWithRelationInput> = {
      fullName: 'fullName',
      memberNumber: 'memberNumber',
      mobileNumber: 'mobileNumber',
      createdAt: 'createdAt',
    };
    const sortField = memberSortFields[query.sortBy ?? 'createdAt'] ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        include: {
          memberships: {
            where: {
              status: MembershipStatus.ACTIVE,
              ...(user.role === UserRole.TRAINER ? { trainerId: user.id } : {}),
            },
            include: {
              program: { select: { name: true, enrollmentType: true } },
              trainer: { select: { firstName: true, lastName: true } },
            },
            orderBy: { startDate: 'desc' },
          },
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      items: items.map((m) => sanitizeMemberListItem(m, user)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOneMember(id: string, user: AuthUser) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: memberInclude,
    });
    if (!member) throw new NotFoundException('Member not found');

    if (user.role === UserRole.TRAINER) {
      const assigned = member.memberships.some((m) => m.trainerId === user.id);
      if (!assigned) throw new ForbiddenException('Not assigned to this member');
    }

    return sanitizeMemberForUser(member, user);
  }

  async addMembership(memberId: string, dto: AddMembershipDto, user: AuthUser) {
    await assertMemberAccess(this.prisma, memberId, user);

    const program = await this.prisma.program.findFirst({
      where: { id: dto.programId, isActive: true },
    });
    if (!program) throw new BadRequestException('Invalid program');

    const duration = await this.prisma.programDuration.findFirst({
      where: {
        id: dto.programDurationId,
        programId: dto.programId,
        isActive: true,
      },
    });
    if (!duration) throw new BadRequestException('Invalid program duration');

    if (dto.trainerId) {
      const trainer = await this.prisma.user.findFirst({
        where: { id: dto.trainerId, role: UserRole.TRAINER, isActive: true },
      });
      if (!trainer) throw new BadRequestException('Invalid trainer');
      if (user.role === UserRole.TRAINER && dto.trainerId !== user.id) {
        throw new ForbiddenException('Trainers can only assign themselves');
      }
    } else if (user.role === UserRole.TRAINER) {
      dto.trainerId = user.id;
    }

    const startDate = new Date(dto.startDate);
    const endDate = addMonths(startDate, duration.months);
    const warnings: string[] = [];

    if (program.enrollmentType === ProgramEnrollmentType.ADD_ON) {
      const covering = await this.prisma.membership.findFirst({
        where: {
          memberId,
          status: MembershipStatus.ACTIVE,
          program: { enrollmentType: ProgramEnrollmentType.INDEPENDENT },
          startDate: { lte: startDate },
          endDate: { gte: endDate },
        },
        include: { program: { select: { name: true } } },
      });
      if (!covering) {
        warnings.push(
          'No active independent membership covers the full period of this add-on program. Proceeding anyway.',
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: {
          memberId,
          programId: dto.programId,
          programDurationId: dto.programDurationId,
          trainerId: dto.trainerId,
          isTrial: dto.isTrial ?? false,
          startDate,
          endDate,
          enrolledById: user.id,
        },
        include: {
          program: { select: { id: true, name: true, enrollmentType: true } },
          programDuration: true,
          trainer: { select: { id: true, firstName: true, lastName: true, email: true } },
          enrolledBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      const payment = await this.paymentService.createCommitmentFromEnrollment(
        membership.id,
        memberId,
        toNumber(duration.price),
        null,
        tx,
      );

      return { membership, payment };
    });

    return { ...result, warnings };
  }

  async updateMember(id: string, dto: UpdateMemberDto, user: AuthUser) {
    if (user.role === UserRole.TRAINER) {
      throw new ForbiddenException('Trainers cannot edit member records');
    }

    await this.findOneMember(id, user);

    let bmi: number | undefined;
    const existing = await this.prisma.member.findUnique({ where: { id } });
    const height = dto.height ?? (existing?.height ? Number(existing.height) : undefined);
    const weight = dto.weight ?? (existing?.weight ? Number(existing.weight) : undefined);
    if (height && weight) bmi = calculateBmi(height, weight);

    return this.prisma.member.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        bmi: bmi !== undefined ? bmi : undefined,
      },
      include: memberInclude,
    });
  }

  async getStats() {
    const [totalMembers, activeMemberships, recentEnrollments] = await Promise.all([
      this.prisma.member.count({ where: { isActive: true } }),
      this.prisma.membership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.enrollment.count({
        where: {
          enrolledAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return { totalMembers, activeMemberships, recentEnrollments };
  }

  async getExpiringMemberships(query: { bucket?: '7' | '15' | '30' | 'beyond'; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7 = new Date(today);
    in7.setDate(in7.getDate() + 7);
    in7.setHours(23, 59, 59, 999);
    const in15 = new Date(today);
    in15.setDate(in15.getDate() + 15);
    in15.setHours(23, 59, 59, 999);
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    in30.setHours(23, 59, 59, 999);

    const baseWhere: Prisma.MembershipWhereInput = {
      status: 'ACTIVE',
      endDate: { gte: today },
    };

    let listWhere: Prisma.MembershipWhereInput = { ...baseWhere };
    if (query.bucket === '7') {
      listWhere = { ...baseWhere, endDate: { gte: today, lte: in7 } };
    } else if (query.bucket === '15') {
      listWhere = { ...baseWhere, endDate: { gte: today, lte: in15 } };
    } else if (query.bucket === '30') {
      listWhere = { ...baseWhere, endDate: { gte: today, lte: in30 } };
    } else if (query.bucket === 'beyond') {
      listWhere = { ...baseWhere, endDate: { gt: in30 } };
    }

    const [within7, within15, within30, beyond30, items, total] = await Promise.all([
      this.prisma.membership.count({
        where: { status: 'ACTIVE', endDate: { gte: today, lte: in7 } },
      }),
      this.prisma.membership.count({
        where: { status: 'ACTIVE', endDate: { gte: today, lte: in15 } },
      }),
      this.prisma.membership.count({
        where: { status: 'ACTIVE', endDate: { gte: today, lte: in30 } },
      }),
      this.prisma.membership.count({
        where: { status: 'ACTIVE', endDate: { gt: in30 } },
      }),
      this.prisma.membership.findMany({
        where: listWhere,
        include: {
          member: { select: { id: true, memberNumber: true, fullName: true, mobileNumber: true } },
          program: { select: { name: true } },
          programDuration: { select: { label: true } },
          trainer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { endDate: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.membership.count({ where: listWhere }),
    ]);

    return {
      summary: { within7, within15, within30, beyond30 },
      items: items.map((m) => {
        const end = new Date(m.endDate);
        end.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / 86400000);
        return {
          membershipId: m.id,
          memberId: m.memberId,
          memberName: m.member.fullName,
          memberNumber: m.member.memberNumber,
          mobileNumber: m.member.mobileNumber,
          program: m.program.name,
          duration: m.programDuration.label,
          endDate: m.endDate,
          daysRemaining,
          trainer: m.trainer
            ? [m.trainer.firstName, m.trainer.lastName].filter(Boolean).join(' ')
            : null,
        };
      }),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  private async generateMemberNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MEM-${year}-`;
    const last = await this.prisma.member.findFirst({
      where: { memberNumber: { startsWith: prefix } },
      orderBy: { memberNumber: 'desc' },
    });
    let seq = 1;
    if (last) seq = parseInt(last.memberNumber.replace(prefix, ''), 10) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  private async generateEnrollmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ENR-${year}-`;
    const last = await this.prisma.enrollment.findFirst({
      where: { enrollmentNumber: { startsWith: prefix } },
      orderBy: { enrollmentNumber: 'desc' },
    });
    let seq = 1;
    if (last) seq = parseInt(last.enrollmentNumber.replace(prefix, ''), 10) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
}
