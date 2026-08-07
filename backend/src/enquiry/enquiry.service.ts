import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnquiryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateRange } from '../common/utils/date-range.util';
import {
  normalizeIndianMobile,
  isValidIndianMobile,
} from '../common/validators/indian-mobile.validator';
import {
  CreateEnquiryDto,
  CreateNoteDto,
  CreateReminderDto,
  EnquiryQueryDto,
  EnquiryStatsQueryDto,
  UpdateEnquiryDto,
  UpdateReminderDto,
  UpdateStatusDto,
} from './dto/enquiry.dto';
import { canTransition, TERMINAL_STATUSES } from './enquiry-workflow';

const enquiryInclude = {
  offeredProgram: { select: { id: true, name: true } },
  offeredProgramDuration: { select: { id: true, label: true, months: true, price: true } },
  offeredDiscount: { select: { id: true, name: true, percentage: true } },
  offerCategory: { select: { id: true, name: true } },
  createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
};

const ENQUIRY_SORT_FIELDS: Record<string, keyof Prisma.EnquiryOrderByWithRelationInput> = {
  fullName: 'fullName',
  mobileNumber: 'mobileNumber',
  status: 'status',
  leadSource: 'leadSource',
  dateOfEnquiry: 'dateOfEnquiry',
  enquiryNumber: 'enquiryNumber',
};

@Injectable()
export class EnquiryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: EnquiryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EnquiryWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.leadSource) where.leadSource = query.leadSource;

    if (query.dateFrom || query.dateTo) {
      where.dateOfEnquiry = {};
      if (query.dateFrom) where.dateOfEnquiry.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        where.dateOfEnquiry.lte = end;
      }
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s } },
        { mobileNumber: { contains: s } },
        { email: { contains: s } },
        { enquiryNumber: { contains: s } },
      ];
    }

    const sortField = ENQUIRY_SORT_FIELDS[query.sortBy ?? 'dateOfEnquiry'] ?? 'dateOfEnquiry';
    const sortOrder = query.sortOrder ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.enquiry.findMany({
        where,
        include: enquiryInclude,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.enquiry.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getStats(query: EnquiryStatsQueryDto = {}) {
    const { start, end, dateFrom, dateTo } = parseDateRange(query.dateFrom, query.dateTo);

    const [newEnquiries, converted, lost, openRemaining] = await Promise.all([
      this.prisma.enquiry.count({
        where: { dateOfEnquiry: { gte: start, lte: end } },
      }),
      this.prisma.enquiry.count({
        where: {
          status: EnquiryStatus.CONVERTED,
          updatedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.enquiry.count({
        where: {
          status: EnquiryStatus.LOST,
          updatedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.enquiry.count({
        where: {
          dateOfEnquiry: { gte: start, lte: end },
          status: { notIn: [EnquiryStatus.CONVERTED, EnquiryStatus.LOST] },
        },
      }),
    ]);

    return { dateFrom, dateTo, newEnquiries, converted, lost, openRemaining };
  }

  async findOne(id: string) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id },
      include: {
        ...enquiryInclude,
        notes: {
          include: {
            createdBy: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reminders: {
          include: {
            createdBy: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
          orderBy: { remindAt: 'asc' },
        },
        member: { select: { id: true, memberNumber: true } },
      },
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');
    return enquiry;
  }

  async create(dto: CreateEnquiryDto, userId: string) {
    await this.validateEnquiryFields(dto);
    const enquiryNumber = await this.generateEnquiryNumber();
    const data = this.mapEnquiryData(dto);

    return this.prisma.$transaction(async (tx) => {
      const enquiry = await tx.enquiry.create({
        data: {
          ...data,
          enquiryNumber,
          createdBy: { connect: { id: userId } },
        } as Prisma.EnquiryCreateInput,
        include: enquiryInclude,
      });

      await tx.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          fromStatus: null,
          toStatus: EnquiryStatus.NEW,
          changedById: userId,
        },
      });

      if (dto.initialNote?.trim()) {
        await tx.enquiryNote.create({
          data: {
            enquiryId: enquiry.id,
            content: dto.initialNote.trim(),
            createdById: userId,
          },
        });
      }

      return enquiry;
    });
  }

  async update(id: string, dto: UpdateEnquiryDto) {
    const enquiry = await this.findOne(id);
    this.assertEditable(enquiry.status);
    await this.validateEnquiryFields(dto);

    return this.prisma.enquiry.update({
      where: { id },
      data: this.mapEnquiryData(dto),
      include: enquiryInclude,
    });
  }

  async updateStatus(id: string, dto: UpdateStatusDto, userId: string) {
    const enquiry = await this.findOne(id);

    if (TERMINAL_STATUSES.includes(enquiry.status)) {
      throw new BadRequestException('Enquiry is already closed');
    }

    if (!canTransition(enquiry.status, dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${enquiry.status} to ${dto.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.enquiry.update({
        where: { id },
        data: { status: dto.status },
        include: enquiryInclude,
      });

      await tx.enquiryStatusHistory.create({
        data: {
          enquiryId: id,
          fromStatus: enquiry.status,
          toStatus: dto.status,
          changedById: userId,
        },
      });

      if (dto.note?.trim()) {
        await tx.enquiryNote.create({
          data: {
            enquiryId: id,
            content: dto.note.trim(),
            createdById: userId,
          },
        });
      }

      return updated;
    });
  }

  async addNote(id: string, dto: CreateNoteDto, userId: string) {
    await this.findOne(id);
    return this.prisma.enquiryNote.create({
      data: {
        enquiryId: id,
        content: dto.content,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async addReminder(id: string, dto: CreateReminderDto, userId: string) {
    const enquiry = await this.findOne(id);
    this.assertEditable(enquiry.status);

    return this.prisma.enquiryReminder.create({
      data: {
        enquiryId: id,
        remindAt: new Date(dto.remindAt),
        note: dto.note,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async updateReminder(enquiryId: string, reminderId: string, dto: UpdateReminderDto) {
    const enquiry = await this.findOne(enquiryId);
    this.assertEditable(enquiry.status);

    const reminder = await this.prisma.enquiryReminder.findFirst({
      where: { id: reminderId, enquiryId },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');

    return this.prisma.enquiryReminder.update({
      where: { id: reminderId },
      data: {
        remindAt: dto.remindAt ? new Date(dto.remindAt) : undefined,
        note: dto.note,
      },
    });
  }

  async reopenReminder(enquiryId: string, reminderId: string) {
    const enquiry = await this.findOne(enquiryId);
    this.assertEditable(enquiry.status);

    const reminder = await this.prisma.enquiryReminder.findFirst({
      where: { id: reminderId, enquiryId },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');

    return this.prisma.enquiryReminder.update({
      where: { id: reminderId },
      data: { completed: false },
    });
  }

  async deleteReminder(enquiryId: string, reminderId: string) {
    const enquiry = await this.findOne(enquiryId);
    this.assertEditable(enquiry.status);

    const reminder = await this.prisma.enquiryReminder.findFirst({
      where: { id: reminderId, enquiryId },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');

    await this.prisma.enquiryReminder.delete({ where: { id: reminderId } });
    return { deleted: true };
  }

  async completeReminder(enquiryId: string, reminderId: string) {
    const enquiry = await this.findOne(enquiryId);
    this.assertEditable(enquiry.status);

    const reminder = await this.prisma.enquiryReminder.findFirst({
      where: { id: reminderId, enquiryId },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');

    return this.prisma.enquiryReminder.update({
      where: { id: reminderId },
      data: { completed: true },
    });
  }

  private assertEditable(status: EnquiryStatus) {
    if (TERMINAL_STATUSES.includes(status)) {
      throw new BadRequestException(
        'Cannot modify enquiry in Converted or Lost status',
      );
    }
  }

  private async validateEnquiryFields(
    dto: CreateEnquiryDto | UpdateEnquiryDto,
  ) {
    if (dto.offeredDiscountId && dto.offeredFlatDiscount != null && dto.offeredFlatDiscount > 0) {
      throw new BadRequestException(
        'Choose either a discount category or a flat discount amount, not both',
      );
    }

    if (dto.offeredProgramDurationId) {
      const duration = await this.prisma.programDuration.findFirst({
        where: {
          id: dto.offeredProgramDurationId,
          isActive: true,
          ...(dto.offeredProgramId
            ? { programId: dto.offeredProgramId }
            : {}),
        },
      });
      if (!duration) {
        throw new BadRequestException('Invalid program duration for selected program');
      }
    }

    if (dto.mobileNumber && !isValidIndianMobile(dto.mobileNumber)) {
      throw new BadRequestException('Invalid mobile number');
    }
    if (dto.alternateContact && !isValidIndianMobile(dto.alternateContact)) {
      throw new BadRequestException('Invalid alternate contact number');
    }
  }

  private mapEnquiryData(dto: CreateEnquiryDto | UpdateEnquiryDto) {
    const data: Prisma.EnquiryUpdateInput = {};

    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.age !== undefined) data.age = dto.age;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.profession !== undefined) data.profession = dto.profession;
    if (dto.familyDetails !== undefined) data.familyDetails = dto.familyDetails;
    if (dto.mobileNumber !== undefined) {
      data.mobileNumber = normalizeIndianMobile(dto.mobileNumber);
    }
    if (dto.alternateContact !== undefined) {
      data.alternateContact = dto.alternateContact
        ? normalizeIndianMobile(dto.alternateContact)
        : null;
    }
    if (dto.email !== undefined) data.email = dto.email || null;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.dateOfEnquiry !== undefined) {
      data.dateOfEnquiry = new Date(dto.dateOfEnquiry);
    }
    if (dto.preferredContactTime !== undefined) {
      data.preferredContactTime = dto.preferredContactTime;
    }
    if (dto.leadSource !== undefined) data.leadSource = dto.leadSource;
    if (dto.offeredProgramId !== undefined) {
      data.offeredProgram = dto.offeredProgramId
        ? { connect: { id: dto.offeredProgramId } }
        : { disconnect: true };
    }
    if (dto.offeredProgramDurationId !== undefined) {
      data.offeredProgramDuration = dto.offeredProgramDurationId
        ? { connect: { id: dto.offeredProgramDurationId } }
        : { disconnect: true };
    }
    if (dto.offeredDiscountId !== undefined) {
      data.offeredDiscount = dto.offeredDiscountId
        ? { connect: { id: dto.offeredDiscountId } }
        : { disconnect: true };
    }
    if (dto.offeredFlatDiscount !== undefined) {
      data.offeredFlatDiscount = dto.offeredFlatDiscount;
    }
    if (dto.offerCategoryId !== undefined) {
      data.offerCategory = dto.offerCategoryId
        ? { connect: { id: dto.offerCategoryId } }
        : { disconnect: true };
    }
    if (dto.offerValidTill !== undefined) {
      data.offerValidTill = dto.offerValidTill ? new Date(dto.offerValidTill) : null;
    }

    if (dto.offeredDiscountId) {
      data.offeredFlatDiscount = null;
    }
    if (dto.offeredFlatDiscount != null && dto.offeredFlatDiscount > 0) {
      data.offeredDiscount = { disconnect: true };
    }

    return data;
  }

  private async generateEnquiryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ENQ-${year}-`;
    const last = await this.prisma.enquiry.findFirst({
      where: { enquiryNumber: { startsWith: prefix } },
      orderBy: { enquiryNumber: 'desc' },
    });

    let seq = 1;
    if (last) {
      const part = last.enquiryNumber.replace(prefix, '');
      seq = parseInt(part, 10) + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
}
