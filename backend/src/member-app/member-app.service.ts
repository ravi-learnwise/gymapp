import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AttendanceSource,
  DietPlanStatus,
  Prisma,
  TrainingCardStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mobileMatchVariants } from '../common/utils/phone.util';
import { FirebaseAdminService } from './firebase-admin.service';

const trainingInclude = {
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

const dietInclude = {
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

const profileSelect = {
  id: true,
  memberNumber: true,
  fullName: true,
  mobileNumber: true,
  alternateContact: true,
  email: true,
  address: true,
  gender: true,
  profession: true,
  familyDetails: true,
  dateOfBirth: true,
  height: true,
  weight: true,
  bmi: true,
  medicalHistory: true,
  allergies: true,
  dietType: true,
  sportsParticipation: true,
  fitnessGoals: true,
  isActive: true,
} satisfies Prisma.MemberSelect;

@Injectable()
export class MemberAppService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private firebase: FirebaseAdminService,
  ) {}

  async loginWithFirebase(idToken: string) {
    const decoded = await this.firebase.verifyIdToken(idToken);
    const email = decoded.email?.trim().toLowerCase() || null;
    const phone = decoded.phone_number?.trim() || null;

    if (!email && !phone) {
      throw new UnauthorizedException('Firebase token has no email or phone');
    }

    let member = decoded.uid
      ? await this.prisma.member.findUnique({ where: { firebaseUid: decoded.uid } })
      : null;

    if (!member) {
      member = await this.matchMember(email, phone);
    }

    if (!member) {
      throw new NotFoundException(
        'No membership found for this email or phone. Contact the gym.',
      );
    }
    if (!member.isActive) {
      throw new UnauthorizedException('This membership is inactive. Contact the gym.');
    }

    if (member.firebaseUid !== decoded.uid) {
      await this.prisma.member.update({
        where: { id: member.id },
        data: { firebaseUid: decoded.uid },
      });
    }

    return this.issueTokens(member.id, member.email, member.fullName, member.memberNumber);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'member_refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const member = await this.prisma.member.findUnique({ where: { id: payload.sub } });
      if (!member?.isActive) {
        throw new UnauthorizedException('Membership inactive');
      }
      return this.issueTokens(member.id, member.email, member.fullName, member.memberNumber);
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getMe(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: profileSelect,
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async getDashboard(memberId: string) {
    const weekday = new Date().getDay();
    const [member, training, diet, attendanceEnabled, openAttendance] = await Promise.all([
      this.prisma.member.findUnique({
        where: { id: memberId },
        select: { id: true, fullName: true, memberNumber: true },
      }),
      this.loadActiveTraining(memberId),
      this.loadActiveDiet(memberId),
      this.isAttendanceEnabled(),
      this.prisma.attendanceRecord.findFirst({
        where: { memberId, checkOut: null },
        orderBy: { checkIn: 'desc' },
      }),
    ]);
    if (!member) throw new NotFoundException('Member not found');

    return {
      member,
      weekday,
      attendanceEnabled,
      openAttendance,
      training: training
        ? {
            id: training.id,
            name: training.name,
            day: training.days.find((d) => d.weekday === weekday) ?? null,
          }
        : null,
      diet: diet
        ? {
            id: diet.id,
            name: diet.name,
            day: diet.days.find((d) => d.weekday === weekday) ?? null,
          }
        : null,
    };
  }

  async getTraining(memberId: string) {
    const card = await this.loadActiveTraining(memberId);
    if (!card) {
      throw new HttpException(
        {
          statusCode: 404,
          code: 'NO_ACTIVE_TRAINING',
          message: 'No training plan yet. Please get in touch with your trainer.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return card;
  }

  async getDiet(memberId: string) {
    const plan = await this.loadActiveDiet(memberId);
    if (!plan) {
      throw new HttpException(
        {
          statusCode: 404,
          code: 'NO_ACTIVE_DIET',
          message: 'No diet plan yet. Please get in touch with your trainer.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return plan;
  }

  async getMemberships(memberId: string) {
    return this.prisma.membership.findMany({
      where: { memberId },
      include: {
        program: { select: { id: true, name: true, description: true } },
        programDuration: { select: { id: true, label: true, months: true, price: true } },
        trainer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getPayments(memberId: string) {
    return this.prisma.paymentCommitment.findMany({
      where: { memberId },
      include: {
        membership: {
          include: {
            program: { select: { name: true } },
            programDuration: { select: { label: true } },
          },
        },
        transactions: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssessments(memberId: string) {
    return this.prisma.fitnessAssessment.findMany({
      where: { memberId },
      include: {
        assessedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { assessedAt: 'desc' },
    });
  }

  async getAttendance(memberId: string) {
    const [attendanceEnabled, openAttendance, recent] = await Promise.all([
      this.isAttendanceEnabled(),
      this.prisma.attendanceRecord.findFirst({
        where: { memberId, checkOut: null },
        orderBy: { checkIn: 'desc' },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { memberId },
        orderBy: { checkIn: 'desc' },
        take: 30,
      }),
    ]);
    return { attendanceEnabled, openAttendance, recent };
  }

  async checkIn(memberId: string) {
    await this.requireAttendanceEnabled();
    const open = await this.prisma.attendanceRecord.findFirst({
      where: { memberId, checkOut: null },
    });
    if (open) {
      throw new ConflictException('You are already checked in');
    }
    return this.prisma.attendanceRecord.create({
      data: {
        memberId,
        checkIn: new Date(),
        source: AttendanceSource.MEMBER,
      },
    });
  }

  async checkOut(memberId: string) {
    await this.requireAttendanceEnabled();
    const open = await this.prisma.attendanceRecord.findFirst({
      where: { memberId, checkOut: null },
      orderBy: { checkIn: 'desc' },
    });
    if (!open) {
      throw new NotFoundException('No open check-in to complete');
    }
    const checkOut = new Date();
    const sessionMinutes = Math.round((checkOut.getTime() - open.checkIn.getTime()) / 60000);
    return this.prisma.attendanceRecord.update({
      where: { id: open.id },
      data: { checkOut, sessionMinutes },
    });
  }

  private async matchMember(email: string | null, phone: string | null) {
    const or: Prisma.MemberWhereInput[] = [];
    if (email) or.push({ email: { equals: email } });
    if (phone) {
      or.push({ mobileNumber: { in: mobileMatchVariants(phone) } });
    }
    if (!or.length) return null;

    const matches = await this.prisma.member.findMany({ where: { OR: or } });
    const active = matches.filter((m) => m.isActive);
    const pool = active.length ? active : matches;
    if (pool.length > 1) {
      throw new ConflictException(
        'Multiple memberships match this login. Contact the gym.',
      );
    }
    return pool[0] ?? null;
  }

  private async loadActiveTraining(memberId: string) {
    return this.prisma.trainingCard.findFirst({
      where: { memberId, status: TrainingCardStatus.ACTIVE },
      include: trainingInclude,
    });
  }

  private async loadActiveDiet(memberId: string) {
    return this.prisma.dietPlan.findFirst({
      where: { memberId, status: DietPlanStatus.ACTIVE },
      include: dietInclude,
    });
  }

  private async isAttendanceEnabled() {
    const config = await this.prisma.gymConfig.findFirst();
    return config?.attendanceEnabled ?? false;
  }

  private async requireAttendanceEnabled() {
    if (!(await this.isAttendanceEnabled())) {
      throw new HttpException(
        { statusCode: 403, code: 'ATTENDANCE_DISABLED', message: 'Attendance is disabled' },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private issueTokens(
    memberId: string,
    email: string | null,
    fullName: string,
    memberNumber: string,
  ) {
    const accessToken = this.jwt.sign(
      { sub: memberId, email, type: 'member_access' },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );
    const refreshToken = this.jwt.sign(
      { sub: memberId, email, type: 'member_refresh' },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );
    return {
      accessToken,
      refreshToken,
      member: { id: memberId, email, fullName, memberNumber },
    };
  }
}
