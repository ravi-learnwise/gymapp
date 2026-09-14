import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto, ExpiringMembershipQueryDto, MemberQueryDto, UpdateMemberDto, AddMembershipDto } from './dto/enrollment.dto';
import { CreateDirectMemberDto } from './dto/direct-member.dto';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller()
export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  @Get('programs')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  getPrograms() {
    return this.enrollmentService.getPrograms();
  }

  @Get('enrollments/prefill/:enquiryId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getPrefill(@Param('enquiryId') enquiryId: string) {
    return this.enrollmentService.getPrefill(enquiryId);
  }

  @Get('enrollments/trainers')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  getTrainers() {
    return this.enrollmentService.getTrainers();
  }

  @Get('enrollments/stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getStats() {
    return this.enrollmentService.getStats();
  }

  @Post('enrollments')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() dto: CreateEnrollmentDto, @CurrentUser() user: AuthUser) {
    return this.enrollmentService.create(dto, user.id);
  }

  @Get('enrollments')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findAllEnrollments() {
    return this.enrollmentService.findAllEnrollments();
  }

  @Get('enrollments/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findOneEnrollment(@Param('id') id: string) {
    return this.enrollmentService.findOneEnrollment(id);
  }

  @Get('memberships/expiring')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getExpiringMemberships(@Query() query: ExpiringMembershipQueryDto) {
    return this.enrollmentService.getExpiringMemberships(query);
  }

  @Get('members/import-template')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="gym-active-members-import.xlsx"')
  async downloadImportTemplate() {
    const buffer = await this.enrollmentService.buildImportTemplate();
    return new StreamableFile(buffer);
  }

  @Post('members/direct')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  createDirect(@Body() dto: CreateDirectMemberDto, @CurrentUser() user: AuthUser) {
    return this.enrollmentService.createDirect(dto, user.id);
  }

  @Post('members/import')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const name = file.originalname.toLowerCase();
        if (!name.endsWith('.xlsx')) {
          cb(new BadRequestException('Upload an .xlsx workbook (download the template first)'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  importMembers(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthUser) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Excel file is required');
    }
    return this.enrollmentService.importMembers(file.buffer, user.id);
  }

  @Get('members')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findAllMembers(@Query() query: MemberQueryDto, @CurrentUser() user: AuthUser) {
    return this.enrollmentService.findAllMembers(query, user);
  }

  @Get('members/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findOneMember(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.enrollmentService.findOneMember(id, user);
  }

  @Patch('members/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enrollmentService.updateMember(id, dto, user);
  }

  @Post('members/:id/memberships')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  addMembership(
    @Param('id') memberId: string,
    @Body() dto: AddMembershipDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.enrollmentService.addMembership(memberId, dto, user);
  }
}
