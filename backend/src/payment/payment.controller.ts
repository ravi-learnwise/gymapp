import {

  Body,

  Controller,

  ForbiddenException,

  Get,

  Param,

  Patch,

  Post,

  Query,

} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@prisma/client';

import { Roles } from '../common/decorators/roles.decorator';

import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

import { assertMemberAccess } from '../common/utils/member-access.util';

import { PrismaService } from '../prisma/prisma.service';

import { PaymentService } from './payment.service';

import {

  CreatePaymentCommitmentDto,

  CreatePaymentReminderDto,

  PaymentQueryDto,

  RecordPaymentDto,

  UpdatePaymentCommitmentDto,

} from './dto/payment.dto';



@ApiTags('payments')

@ApiBearerAuth()

@Controller('payments')

export class PaymentController {

  constructor(

    private paymentService: PaymentService,

    private prisma: PrismaService,

  ) {}



  @Get()

  @Roles(UserRole.OWNER, UserRole.MANAGER)

  findAll(@Query() query: PaymentQueryDto) {

    return this.paymentService.findAll(query);

  }



  @Get('stats')

  @Roles(UserRole.OWNER, UserRole.MANAGER)

  getStats() {

    return this.paymentService.getStats();

  }



  @Get('member/:memberId')

  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)

  async findByMember(

    @Param('memberId') memberId: string,

    @CurrentUser() user: AuthUser,

  ) {

    await assertMemberAccess(this.prisma, memberId, user);

    return this.paymentService.findByMember(memberId);

  }



  @Get('membership/:membershipId')

  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)

  async findByMembership(

    @Param('membershipId') membershipId: string,

    @CurrentUser() user: AuthUser,

  ) {

    const membership = await this.prisma.membership.findUnique({

      where: { id: membershipId },

      select: { memberId: true },

    });

    if (!membership) throw new NotFoundException('Membership not found');

    await assertMemberAccess(this.prisma, membership.memberId, user);

    return this.paymentService.findByMembership(membershipId);

  }



  @Get(':id')

  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)

  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {

    const commitment = await this.paymentService.findOne(id);

    await assertMemberAccess(this.prisma, commitment.memberId, user);

    return commitment;

  }



  @Post()

  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)

  async create(

    @Body() dto: CreatePaymentCommitmentDto,

    @CurrentUser() user: AuthUser,

  ) {

    const membership = await this.prisma.membership.findUnique({

      where: { id: dto.membershipId },

      select: { memberId: true },

    });

    if (!membership) throw new NotFoundException('Membership not found');

    await assertMemberAccess(this.prisma, membership.memberId, user);

    return this.paymentService.createCommitment(dto);

  }



  @Patch(':id')

  @Roles(UserRole.OWNER, UserRole.MANAGER)

  update(@Param('id') id: string, @Body() dto: UpdatePaymentCommitmentDto) {

    return this.paymentService.updateCommitment(id, dto);

  }



  @Post(':id/transactions')

  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)

  async recordPayment(

    @Param('id') id: string,

    @Body() dto: RecordPaymentDto,

    @CurrentUser() user: AuthUser,

  ) {

    const commitment = await this.paymentService.findOne(id);

    await assertMemberAccess(this.prisma, commitment.memberId, user);

    return this.paymentService.recordPayment(id, dto, user.id);

  }



  @Get(':id/receipt/:transactionId')

  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)

  async getReceipt(

    @Param('id') id: string,

    @Param('transactionId') transactionId: string,

    @CurrentUser() user: AuthUser,

  ) {

    const commitment = await this.paymentService.findOne(id);

    await assertMemberAccess(this.prisma, commitment.memberId, user);

    return this.paymentService.getReceipt(id, transactionId);

  }



  @Post(':id/reminders')

  @Roles(UserRole.OWNER, UserRole.MANAGER)

  addReminder(

    @Param('id') id: string,

    @Body() dto: CreatePaymentReminderDto,

    @CurrentUser() user: AuthUser,

  ) {

    return this.paymentService.addReminder(id, dto, user.id);

  }



  @Patch(':id/reminders/:reminderId/complete')

  @Roles(UserRole.OWNER, UserRole.MANAGER)

  completeReminder(

    @Param('id') id: string,

    @Param('reminderId') reminderId: string,

  ) {

    return this.paymentService.completeReminder(id, reminderId);

  }

}


