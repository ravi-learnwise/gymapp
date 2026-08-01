import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentCommitmentDto,
  CreatePaymentReminderDto,
  PaymentQueryDto,
  RecordPaymentDto,
  UpdatePaymentCommitmentDto,
} from './dto/payment.dto';
import {
  computePaymentAmounts,
  derivePaymentStatus,
  toNumber,
} from './payment.util';

const commitmentInclude = {
  member: { select: { id: true, memberNumber: true, fullName: true, mobileNumber: true } },
  membership: {
    include: {
      program: { select: { name: true } },
      programDuration: { select: { label: true, price: true } },
    },
  },
  transactions: {
    include: {
      recordedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { paymentDate: 'desc' as const },
  },
  reminders: {
    include: {
      createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { remindAt: 'asc' as const },
  },
};

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaymentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentCommitmentWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.outstanding === 'true') {
      where.status = { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] };
    }

    if (query.search) {
      const s = query.search.trim();
      where.member = {
        OR: [
          { fullName: { contains: s } },
          { mobileNumber: { contains: s } },
          { memberNumber: { contains: s } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.paymentCommitment.findMany({
        where,
        include: {
          member: { select: { id: true, memberNumber: true, fullName: true, mobileNumber: true } },
          membership: { include: { program: { select: { name: true } } } },
        },
        orderBy: [{ status: 'asc' }, { commitmentDate: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.paymentCommitment.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getStats() {
    const [total, pending, partial, paid, outstandingAmount, dueReminders] =
      await Promise.all([
        this.prisma.paymentCommitment.count(),
        this.prisma.paymentCommitment.count({ where: { status: PaymentStatus.PENDING } }),
        this.prisma.paymentCommitment.count({ where: { status: PaymentStatus.PARTIAL } }),
        this.prisma.paymentCommitment.count({ where: { status: PaymentStatus.PAID } }),
        this.prisma.paymentCommitment.aggregate({
          where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] } },
          _sum: { pendingAmount: true },
        }),
        this.prisma.paymentReminder.count({
          where: { completed: false, remindAt: { lte: new Date() } },
        }),
      ]);

    return {
      total,
      pending,
      partial,
      paid,
      outstandingAmount: toNumber(outstandingAmount._sum.pendingAmount ?? 0),
      dueReminders,
    };
  }

  async findOne(id: string) {
    const commitment = await this.prisma.paymentCommitment.findUnique({
      where: { id },
      include: commitmentInclude,
    });
    if (!commitment) throw new NotFoundException('Payment commitment not found');
    return commitment;
  }

  async findByMembership(membershipId: string) {
    const commitment = await this.prisma.paymentCommitment.findUnique({
      where: { membershipId },
      include: commitmentInclude,
    });
    if (!commitment) throw new NotFoundException('No payment record for this membership');
    return commitment;
  }

  async findByMember(memberId: string) {
    return this.prisma.paymentCommitment.findMany({
      where: { memberId },
      include: {
        membership: { include: { program: { select: { name: true } } } },
        transactions: { orderBy: { paymentDate: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCommitment(dto: CreatePaymentCommitmentDto, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;

    const membership = await db.membership.findUnique({
      where: { id: dto.membershipId },
      include: { programDuration: true, paymentCommitment: true },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.paymentCommitment) {
      throw new BadRequestException('Payment commitment already exists');
    }

    const totalFee = toNumber(membership.programDuration.price);
    const discountAmount = dto.discountAmount ?? 0;
    const { finalAmount, gstAmount } = computePaymentAmounts(
      totalFee,
      discountAmount,
      dto.gstPercent,
    );

    return db.paymentCommitment.create({
      data: {
        membershipId: membership.id,
        memberId: membership.memberId,
        totalFee,
        discountAmount,
        finalAmount,
        pendingAmount: finalAmount,
        amountPaid: 0,
        gstPercent: dto.gstPercent,
        gstAmount,
        status: PaymentStatus.PENDING,
        commitmentDate: dto.commitmentDate ? new Date(dto.commitmentDate) : new Date(),
        commitmentNotes: dto.commitmentNotes,
      },
      include: commitmentInclude,
    });
  }

  /** Called from enrollment transaction */
  async createCommitmentFromEnrollment(
    membershipId: string,
    memberId: string,
    totalFee: number,
    discountPercent: number | null,
    tx: Prisma.TransactionClient,
  ) {
    const discountAmount =
      discountPercent && discountPercent > 0
        ? Math.round(totalFee * (discountPercent / 100) * 100) / 100
        : 0;
    const { finalAmount, gstAmount } = computePaymentAmounts(totalFee, discountAmount);

    return tx.paymentCommitment.create({
      data: {
        membershipId,
        memberId,
        totalFee,
        discountAmount,
        finalAmount,
        pendingAmount: finalAmount,
        amountPaid: 0,
        gstAmount,
        status: PaymentStatus.PENDING,
        commitmentDate: new Date(),
      },
    });
  }

  async updateCommitment(id: string, dto: UpdatePaymentCommitmentDto) {
    const existing = await this.findOne(id);
    const totalFee = toNumber(existing.totalFee);
    const discountAmount =
      dto.discountAmount !== undefined
        ? dto.discountAmount
        : toNumber(existing.discountAmount);
    const gstPercent =
      dto.gstPercent !== undefined
        ? dto.gstPercent
        : existing.gstPercent != null
          ? toNumber(existing.gstPercent)
          : null;
    const amountPaid = toNumber(existing.amountPaid);

    const { finalAmount, gstAmount } = computePaymentAmounts(
      totalFee,
      discountAmount,
      gstPercent,
    );
    const pendingAmount = Math.max(0, finalAmount - amountPaid);
    const status = derivePaymentStatus(amountPaid, finalAmount);

    return this.prisma.paymentCommitment.update({
      where: { id },
      data: {
        discountAmount,
        finalAmount,
        pendingAmount,
        gstPercent: dto.gstPercent !== undefined ? dto.gstPercent : undefined,
        gstAmount,
        status,
        commitmentDate: dto.commitmentDate ? new Date(dto.commitmentDate) : undefined,
        commitmentNotes: dto.commitmentNotes,
      },
      include: commitmentInclude,
    });
  }

  async recordPayment(id: string, dto: RecordPaymentDto, userId: string) {
    const commitment = await this.findOne(id);
    const finalAmount = toNumber(commitment.finalAmount);
    const currentPaid = toNumber(commitment.amountPaid);
    const newPaid = currentPaid + dto.amount;

    if (newPaid > finalAmount + 0.01) {
      throw new BadRequestException(
        `Payment exceeds pending amount (₹${(finalAmount - currentPaid).toFixed(2)} remaining)`,
      );
    }

    const receiptNumber = await this.generateReceiptNumber();
    const pendingAmount = Math.max(0, finalAmount - newPaid);
    const status = derivePaymentStatus(newPaid, finalAmount);

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.create({
        data: {
          commitmentId: id,
          receiptNumber,
          amount: dto.amount,
          paymentMode: dto.paymentMode,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          notes: dto.notes,
          recordedById: userId,
        },
        include: {
          recordedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      await tx.paymentCommitment.update({
        where: { id },
        data: { amountPaid: newPaid, pendingAmount, status },
      });

      return transaction;
    });
  }

  async getReceipt(commitmentId: string, transactionId: string) {
    const commitment = await this.findOne(commitmentId);
    const transaction = commitment.transactions.find((t) => t.id === transactionId);
    if (!transaction) throw new NotFoundException('Transaction not found');

    const gym = await this.prisma.gymConfig.findFirst();

    return {
      gym: {
        name: gym?.name ?? 'My Gym',
        address: gym?.address,
        gstNumber: gym?.gstNumber,
      },
      receiptNumber: transaction.receiptNumber,
      paymentDate: transaction.paymentDate,
      paymentMode: transaction.paymentMode,
      amount: transaction.amount,
      notes: transaction.notes,
      member: commitment.member,
      program: commitment.membership.program.name,
      totalFee: commitment.totalFee,
      discountAmount: commitment.discountAmount,
      finalAmount: commitment.finalAmount,
      amountPaid: commitment.amountPaid,
      pendingAmount: commitment.pendingAmount,
      gstAmount: commitment.gstAmount,
      recordedBy: transaction.recordedBy,
    };
  }

  async addReminder(id: string, dto: CreatePaymentReminderDto, userId: string) {
    await this.findOne(id);
    return this.prisma.paymentReminder.create({
      data: {
        commitmentId: id,
        remindAt: new Date(dto.remindAt),
        note: dto.note,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async completeReminder(commitmentId: string, reminderId: string) {
    const reminder = await this.prisma.paymentReminder.findFirst({
      where: { id: reminderId, commitmentId },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');

    return this.prisma.paymentReminder.update({
      where: { id: reminderId },
      data: { completed: true },
    });
  }

  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCP-${year}-`;
    const last = await this.prisma.paymentTransaction.findFirst({
      where: { receiptNumber: { startsWith: prefix } },
      orderBy: { receiptNumber: 'desc' },
    });
    let seq = 1;
    if (last) seq = parseInt(last.receiptNumber.replace(prefix, ''), 10) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
}
