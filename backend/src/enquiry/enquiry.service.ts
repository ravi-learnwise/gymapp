import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnquiryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEnquiryDto,
  CreateNoteDto,
  CreateReminderDto,
  EnquiryQueryDto,
  UpdateEnquiryDto,
  UpdateStatusDto,
} from './dto/enquiry.dto';
import { canTransition, TERMINAL_STATUSES } from './enquiry-workflow';

const enquiryInclude = {
  offeredProgram: { select: { id: true, name: true } },
  offeredDiscount: { select: { id: true, name: true, percentage: true } },
  offerCategory: { select: { id: true, name: true } },
  createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
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
      if (query.dateTo) where.dateOfEnquiry.lte = new Date(query.dateTo);
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

    const [items, total] = await Promise.all([
      this.prisma.enquiry.findMany({
        where,
        include: enquiryInclude,
        orderBy: { dateOfEnquiry: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.enquiry.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getStats() {
    const [total, byStatus, converted, lost] = await Promise.all([
      this.prisma.enquiry.count(),
      this.prisma.enquiry.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.enquiry.count({ where: { status: EnquiryStatus.CONVERTED } }),
      this.prisma.enquiry.count({ where: { status: EnquiryStatus.LOST } }),
    ]);

    const statusMap = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count.status]),
    );

    const closed = converted + lost;
    const conversionRate = closed > 0 ? (converted / closed) * 100 : 0;

    return {
      total,
      byStatus: statusMap,
      converted,
      lost,
      conversionRate: Math.round(conversionRate * 100) / 100,
      open: total - converted - lost,
    };
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
    const enquiryNumber = await this.generateEnquiryNumber();

    return this.prisma.$transaction(async (tx) => {
      const enquiry = await tx.enquiry.create({
        data: {
          enquiryNumber,
          fullName: dto.fullName,
          age: dto.age,
          gender: dto.gender,
          profession: dto.profession,
          familyDetails: dto.familyDetails,
          mobileNumber: dto.mobileNumber,
          alternateContact: dto.alternateContact,
          email: dto.email,
          address: dto.address,
          dateOfEnquiry: dto.dateOfEnquiry
            ? new Date(dto.dateOfEnquiry)
            : new Date(),
          preferredContactTime: dto.preferredContactTime,
          leadSource: dto.leadSource,
          offeredProgramId: dto.offeredProgramId,
          offeredDiscountId: dto.offeredDiscountId,
          offerCategoryId: dto.offerCategoryId,
          offerValidTill: dto.offerValidTill
            ? new Date(dto.offerValidTill)
            : undefined,
          createdById: userId,
        },
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
    if (TERMINAL_STATUSES.includes(enquiry.status)) {
      throw new BadRequestException(
        'Cannot edit enquiry in Converted or Lost status',
      );
    }

    return this.prisma.enquiry.update({
      where: { id },
      data: {
        ...dto,
        offerValidTill: dto.offerValidTill
          ? new Date(dto.offerValidTill)
          : undefined,
      },
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
    await this.findOne(id);
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

  async completeReminder(enquiryId: string, reminderId: string) {
    const reminder = await this.prisma.enquiryReminder.findFirst({
      where: { id: reminderId, enquiryId },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');

    return this.prisma.enquiryReminder.update({
      where: { id: reminderId },
      data: { completed: true },
    });
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
