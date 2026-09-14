import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnquiryStatus, LeadSource, MembershipStatus, Prisma, ProgramEnrollmentType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { assertMemberAccess } from '../common/utils/member-access.util';
import { sanitizeMemberForUser, sanitizeMemberListItem } from '../common/utils/member-view.util';
import { TERMINAL_STATUSES } from '../enquiry/enquiry-workflow';
import { AddMembershipDto, CreateEnrollmentDto, MemberQueryDto, UpdateMemberDto } from './dto/enrollment.dto';
import { CreateDirectMemberDto } from './dto/direct-member.dto';
import { addMonths, calculateBmi } from './bmi.util';
import { PaymentService } from '../payment/payment.service';
import { computePaymentAmounts, toNumber } from '../payment/payment.util';
import { AssessmentService } from '../assessment/assessment.service';
import {
  isValidIndianMobile,
  normalizeIndianMobile,
} from '../common/validators/indian-mobile.validator';
import { parseMemberImportWorkbook } from './member-import.parser';
import { buildMemberImportWorkbook } from './member-import.template';

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

  /**
   * UI-facing “create member” path. Creates a paired enquiry, then converts it
   * into member + primary membership + payment in one transaction.
   */
  async createDirect(dto: CreateDirectMemberDto, userId: string) {
    const mobileNumber = normalizeIndianMobile(dto.mobileNumber);
    if (!isValidIndianMobile(mobileNumber)) {
      throw new BadRequestException('Invalid mobile number');
    }
    if (dto.alternateContact && !isValidIndianMobile(dto.alternateContact)) {
      throw new BadRequestException('Invalid alternate contact number');
    }
    if ((dto.amountPaid ?? 0) > 0 && !dto.paymentMode) {
      throw new BadRequestException('Payment mode is required when amount paid is greater than 0');
    }

    const duplicate = await this.prisma.member.findFirst({
      where: { mobileNumber },
      select: { id: true, memberNumber: true, fullName: true },
    });
    if (duplicate) {
      throw new BadRequestException(
        `A member with this mobile number already exists (${duplicate.memberNumber} — ${duplicate.fullName})`,
      );
    }

    if (dto.existingMemberId) {
      const memberNumber = dto.existingMemberId.trim();
      if (!/^[A-Za-z0-9._-]+$/.test(memberNumber)) {
        throw new BadRequestException(
          'Existing Member ID may contain letters, numbers, dots, underscores and hyphens only',
        );
      }
      const taken = await this.prisma.member.findUnique({
        where: { memberNumber },
        select: { id: true },
      });
      if (taken) {
        throw new BadRequestException(`Member ID ${memberNumber} is already in use`);
      }
    }

    const duration = await this.prisma.programDuration.findFirst({
      where: {
        id: dto.programDurationId,
        programId: dto.programId,
        isActive: true,
        program: { isActive: true },
      },
      include: { program: { select: { name: true, enrollmentType: true } } },
    });
    if (!duration) throw new BadRequestException('Invalid program or duration');
    if (duration.program.enrollmentType === ProgramEnrollmentType.ADD_ON) {
      throw new BadRequestException(
        'Primary membership must use an independent program, not an add-on program',
      );
    }

    if (dto.trainerId) {
      const trainer = await this.prisma.user.findFirst({
        where: { id: dto.trainerId, role: UserRole.TRAINER, isActive: true },
      });
      if (!trainer) throw new BadRequestException('Invalid trainer');
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : addMonths(startDate, duration.months);
    const today = startOfDay(new Date());
    if (startOfDay(endDate) < today) {
      throw new BadRequestException(
        'Membership end date is in the past. Import only currently active members.',
      );
    }

    const bmi = dto.height && dto.weight ? calculateBmi(dto.height, dto.weight) : undefined;
    const enquiryNumber = await this.generateEnquiryNumber();
    const memberNumber = dto.existingMemberId?.trim() || (await this.generateMemberNumber());
    const enrollmentNumber = await this.generateEnrollmentNumber();

    return this.prisma.$transaction(async (tx) => {
      const enquiry = await tx.enquiry.create({
        data: {
          enquiryNumber,
          fullName: dto.fullName.trim(),
          age: dto.age,
          gender: dto.gender,
          profession: dto.profession,
          familyDetails: dto.familyDetails,
          mobileNumber,
          alternateContact: dto.alternateContact
            ? normalizeIndianMobile(dto.alternateContact)
            : undefined,
          email: dto.email || undefined,
          address: dto.address,
          dateOfEnquiry: startDate,
          leadSource: LeadSource.OTHER,
          offeredProgramId: dto.programId,
          offeredProgramDurationId: dto.programDurationId,
          offeredFlatDiscount:
            dto.discountAmount != null && dto.discountAmount > 0 ? dto.discountAmount : undefined,
          status: EnquiryStatus.NEW,
          createdById: userId,
        },
      });

      await tx.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          fromStatus: null,
          toStatus: EnquiryStatus.NEW,
          changedById: userId,
        },
      });

      await tx.enquiryNote.create({
        data: {
          enquiryId: enquiry.id,
          content: 'Silent enquiry created during direct member intake.',
          createdById: userId,
        },
      });

      const member = await tx.member.create({
        data: {
          memberNumber,
          fullName: dto.fullName.trim(),
          mobileNumber,
          alternateContact: dto.alternateContact
            ? normalizeIndianMobile(dto.alternateContact)
            : undefined,
          email: dto.email || undefined,
          address: dto.address,
          gender: dto.gender,
          profession: dto.profession,
          familyDetails: dto.familyDetails,
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

      const commitment = await this.paymentService.createCommitmentFromEnrollment(
        membership.id,
        member.id,
        toNumber(duration.price),
        null,
        tx,
        dto.discountAmount != null && dto.discountAmount > 0 ? dto.discountAmount : null,
      );

      if (dto.gstPercent != null && dto.gstPercent > 0) {
        const { gstAmount } = computePaymentAmounts(
          toNumber(commitment.totalFee),
          toNumber(commitment.discountAmount),
          dto.gstPercent,
        );
        await tx.paymentCommitment.update({
          where: { id: commitment.id },
          data: { gstPercent: dto.gstPercent, gstAmount },
        });
      }

      let paymentSummary: {
        id: string;
        status: string;
        amountPaid: number;
        pendingAmount: number;
        receiptNumber?: string;
      } | null = {
        id: commitment.id,
        status: commitment.status,
        amountPaid: toNumber(commitment.amountPaid),
        pendingAmount: toNumber(commitment.pendingAmount),
      };

      if ((dto.amountPaid ?? 0) > 0 && dto.paymentMode) {
        const recorded = await this.paymentService.recordInitialPayment(
          tx,
          commitment.id,
          {
            amount: dto.amountPaid!,
            paymentMode: dto.paymentMode,
            paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : startDate,
            notes: dto.paymentNotes,
          },
          userId,
        );
        paymentSummary = {
          id: commitment.id,
          status: recorded.status,
          amountPaid: recorded.amountPaid,
          pendingAmount: recorded.pendingAmount,
          receiptNumber: recorded.receiptNumber,
        };
      }

      const enrollment = await tx.enrollment.create({
        data: {
          enrollmentNumber,
          enquiryId: enquiry.id,
          memberId: member.id,
          membershipId: membership.id,
          enrolledById: userId,
        },
      });

      await tx.enquiry.update({
        where: { id: enquiry.id },
        data: { status: EnquiryStatus.CONVERTED },
      });

      await tx.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          fromStatus: EnquiryStatus.NEW,
          toStatus: EnquiryStatus.CONVERTED,
          changedById: userId,
        },
      });

      await tx.enquiryNote.create({
        data: {
          enquiryId: enquiry.id,
          content: `Converted via direct member intake ${enrollmentNumber}`,
          createdById: userId,
        },
      });

      return {
        member: { id: member.id, memberNumber: member.memberNumber, fullName: member.fullName },
        membership: {
          id: membership.id,
          startDate: membership.startDate,
          endDate: membership.endDate,
          program: duration.program.name,
        },
        enrollment: { id: enrollment.id, enrollmentNumber },
        enquiry: { id: enquiry.id, enquiryNumber },
        payment: paymentSummary,
      };
    });
  }

  async buildImportTemplate(): Promise<Buffer> {
    const [programs, trainers] = await Promise.all([
      this.prisma.program.findMany({
        where: { isActive: true },
        include: { durations: { where: { isActive: true }, orderBy: { months: 'asc' } } },
        orderBy: { name: 'asc' },
      }),
      this.getTrainers(),
    ]);
    return buildMemberImportWorkbook(programs, trainers);
  }

  async importMembers(fileBuffer: Buffer, userId: string) {
    const parsed = await parseMemberImportWorkbook(fileBuffer);
    const programs = await this.prisma.program.findMany({
      where: { isActive: true },
      include: { durations: { where: { isActive: true }, orderBy: { months: 'asc' } } },
    });
    const trainers = await this.getTrainers();

    const results: Array<{
      row: number;
      fullName?: string;
      mobileNumber?: string;
      status: 'created' | 'failed';
      memberNumber?: string;
      memberId?: string;
      error?: string;
    }> = parsed.rowErrors.map((e) => ({
      row: e.excelRow,
      status: 'failed' as const,
      error: e.error,
    }));

    const seenMobiles = new Set<string>();
    const seenMemberIds = new Set<string>();

    for (const row of parsed.rows) {
      try {
        const mobile = normalizeIndianMobile(row.mobileNumber);
        if (seenMobiles.has(mobile)) {
          throw new BadRequestException('Duplicate mobile number in this file');
        }
        seenMobiles.add(mobile);

        if (row.existingMemberId) {
          const id = row.existingMemberId.trim();
          if (seenMemberIds.has(id.toLowerCase())) {
            throw new BadRequestException('Duplicate Existing Member ID in this file');
          }
          seenMemberIds.add(id.toLowerCase());
        }

        const { programId, programDurationId } = resolveProgramDuration(
          programs,
          row.programName,
          row.durationLabel,
        );
        const trainerId = row.trainerEmail
          ? resolveTrainerId(trainers, row.trainerEmail)
          : undefined;

        const created = await this.createDirect(
          {
            fullName: row.fullName,
            mobileNumber: mobile,
            alternateContact: row.alternateContact,
            email: row.email,
            address: row.address,
            gender: row.gender,
            age: row.age,
            profession: row.profession,
            familyDetails: row.familyDetails,
            dateOfBirth: row.dateOfBirth,
            height: row.height,
            weight: row.weight,
            medicalHistory: row.medicalHistory,
            allergies: row.allergies,
            dietType: row.dietType,
            fitnessGoals: row.fitnessGoals,
            existingMemberId: row.existingMemberId,
            programId,
            programDurationId,
            trainerId,
            startDate: row.membershipStartDate,
            endDate: row.membershipEndDate,
            discountAmount: row.discountAmount,
            amountPaid: row.amountPaid,
            paymentMode: row.paymentMode,
            paymentDate: row.paymentDate,
            paymentNotes: row.paymentNotes,
          },
          userId,
        );

        results.push({
          row: row.excelRow,
          fullName: row.fullName,
          mobileNumber: mobile,
          status: 'created',
          memberNumber: created.member.memberNumber,
          memberId: created.member.id,
        });
      } catch (err) {
        results.push({
          row: row.excelRow,
          fullName: row.fullName,
          mobileNumber: row.mobileNumber,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Import failed',
        });
      }
    }

    results.sort((a, b) => a.row - b.row);
    const created = results.filter((r) => r.status === 'created').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return {
      totalRows: results.length,
      created,
      failed,
      results,
    };
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

  private async generateEnquiryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ENQ-${year}-`;
    const last = await this.prisma.enquiry.findFirst({
      where: { enquiryNumber: { startsWith: prefix } },
      orderBy: { enquiryNumber: 'desc' },
    });
    let seq = 1;
    if (last) seq = parseInt(last.enquiryNumber.replace(prefix, ''), 10) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
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

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function resolveProgramDuration(
  programs: Array<{
    id: string;
    name: string;
    enrollmentType: ProgramEnrollmentType;
    durations: Array<{ id: string; label: string; months: number; isActive: boolean }>;
  }>,
  programName: string,
  durationLabel: string,
): { programId: string; programDurationId: string } {
  const name = programName.trim().toLowerCase();
  const program = programs.find((p) => p.name.trim().toLowerCase() === name);
  if (!program) {
    throw new BadRequestException(
      `Program "${programName}" was not found. Use an exact name from the Reference sheet.`,
    );
  }
  if (program.enrollmentType === ProgramEnrollmentType.ADD_ON) {
    throw new BadRequestException(
      `Program "${program.name}" is an add-on. Primary membership must use an independent program.`,
    );
  }

  const label = durationLabel.trim().toLowerCase();
  const monthsMatch = /^(\d+)\s*(months?|mo)?$/.exec(label);
  const duration =
    program.durations.find((d) => d.isActive && d.label.trim().toLowerCase() === label) ??
    (monthsMatch
      ? program.durations.find((d) => d.isActive && d.months === Number(monthsMatch[1]))
      : undefined);

  if (!duration) {
    const options = program.durations.filter((d) => d.isActive).map((d) => d.label).join(', ');
    throw new BadRequestException(
      `Duration "${durationLabel}" was not found for ${program.name}. Available: ${options || 'none'}`,
    );
  }

  return { programId: program.id, programDurationId: duration.id };
}

function resolveTrainerId(
  trainers: Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>,
  value: string,
): string {
  const v = value.trim().toLowerCase();
  const trainer =
    trainers.find((t) => t.email.toLowerCase() === v) ??
    trainers.find((t) => [t.firstName, t.lastName].filter(Boolean).join(' ').toLowerCase() === v);
  if (!trainer) {
    throw new BadRequestException(`Trainer "${value}" was not found. Use a trainer email from the Reference sheet.`);
  }
  return trainer.id;
}
