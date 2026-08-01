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
import { EnquiryService } from './enquiry.service';
import {
  CreateEnquiryDto,
  CreateNoteDto,
  CreateReminderDto,
  EnquiryQueryDto,
  UpdateEnquiryDto,
  UpdateStatusDto,
} from './dto/enquiry.dto';

@ApiTags('enquiries')
@ApiBearerAuth()
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('enquiries')
export class EnquiryController {
  constructor(private enquiryService: EnquiryService) {}

  @Get()
  findAll(@Query() query: EnquiryQueryDto) {
    return this.enquiryService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.enquiryService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enquiryService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEnquiryDto, @CurrentUser() user: AuthUser) {
    return this.enquiryService.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEnquiryDto) {
    return this.enquiryService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enquiryService.updateStatus(id, dto, user.id);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enquiryService.addNote(id, dto, user.id);
  }

  @Post(':id/reminders')
  addReminder(
    @Param('id') id: string,
    @Body() dto: CreateReminderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enquiryService.addReminder(id, dto, user.id);
  }

  @Patch(':id/reminders/:reminderId/complete')
  completeReminder(
    @Param('id') id: string,
    @Param('reminderId') reminderId: string,
  ) {
    return this.enquiryService.completeReminder(id, reminderId);
  }
}
