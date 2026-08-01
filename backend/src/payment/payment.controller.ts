import {
  Body,
  Controller,
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
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get()
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.paymentService.getStats();
  }

  @Get('member/:memberId')
  findByMember(@Param('memberId') memberId: string) {
    return this.paymentService.findByMember(memberId);
  }

  @Get('membership/:membershipId')
  findByMembership(@Param('membershipId') membershipId: string) {
    return this.paymentService.findByMembership(membershipId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePaymentCommitmentDto) {
    return this.paymentService.createCommitment(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePaymentCommitmentDto) {
    return this.paymentService.updateCommitment(id, dto);
  }

  @Post(':id/transactions')
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentService.recordPayment(id, dto, user.id);
  }

  @Get(':id/receipt/:transactionId')
  getReceipt(
    @Param('id') id: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.paymentService.getReceipt(id, transactionId);
  }

  @Post(':id/reminders')
  addReminder(
    @Param('id') id: string,
    @Body() dto: CreatePaymentReminderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentService.addReminder(id, dto, user.id);
  }

  @Patch(':id/reminders/:reminderId/complete')
  completeReminder(
    @Param('id') id: string,
    @Param('reminderId') reminderId: string,
  ) {
    return this.paymentService.completeReminder(id, reminderId);
  }
}
