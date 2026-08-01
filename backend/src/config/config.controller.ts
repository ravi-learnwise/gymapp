import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { ConfigService } from './config.service';
import {
  CreateDiscountCategoryDto,
  CreateDurationDto,
  CreateOfferCategoryDto,
  CreateProgramDto,
  UpdateDiscountCategoryDto,
  UpdateDurationDto,
  UpdateGymConfigDto,
  UpdateOfferCategoryDto,
  UpdateProgramDto,
} from './dto/config.dto';

@ApiTags('config')
@ApiBearerAuth()
@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('gym')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getGym() {
    return this.configService.getGymConfig();
  }

  @Patch('gym')
  @Roles(UserRole.OWNER)
  updateGym(@Body() dto: UpdateGymConfigDto) {
    return this.configService.updateGymConfig(dto);
  }

  @Get('programs')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getPrograms() {
    return this.configService.getPrograms();
  }

  @Post('programs')
  @Roles(UserRole.OWNER)
  createProgram(@Body() dto: CreateProgramDto) {
    return this.configService.createProgram(dto);
  }

  @Patch('programs/:id')
  @Roles(UserRole.OWNER)
  updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.configService.updateProgram(id, dto);
  }

  @Delete('programs/:id')
  @Roles(UserRole.OWNER)
  deleteProgram(@Param('id') id: string) {
    return this.configService.deleteProgram(id);
  }

  @Post('programs/:programId/durations')
  @Roles(UserRole.OWNER)
  addDuration(
    @Param('programId') programId: string,
    @Body() dto: CreateDurationDto,
  ) {
    return this.configService.addDuration(programId, dto);
  }

  @Patch('durations/:id')
  @Roles(UserRole.OWNER)
  updateDuration(@Param('id') id: string, @Body() dto: UpdateDurationDto) {
    return this.configService.updateDuration(id, dto);
  }

  @Delete('durations/:id')
  @Roles(UserRole.OWNER)
  deleteDuration(@Param('id') id: string) {
    return this.configService.deleteDuration(id);
  }

  @Get('discount-categories')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getDiscounts() {
    return this.configService.getDiscountCategories();
  }

  @Post('discount-categories')
  @Roles(UserRole.OWNER)
  createDiscount(@Body() dto: CreateDiscountCategoryDto) {
    return this.configService.createDiscountCategory(dto);
  }

  @Patch('discount-categories/:id')
  @Roles(UserRole.OWNER)
  updateDiscount(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountCategoryDto,
  ) {
    return this.configService.updateDiscountCategory(id, dto);
  }

  @Delete('discount-categories/:id')
  @Roles(UserRole.OWNER)
  deleteDiscount(@Param('id') id: string) {
    return this.configService.deleteDiscountCategory(id);
  }

  @Get('offer-categories')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getOffers() {
    return this.configService.getOfferCategories();
  }

  @Post('offer-categories')
  @Roles(UserRole.OWNER)
  createOffer(@Body() dto: CreateOfferCategoryDto) {
    return this.configService.createOfferCategory(dto);
  }

  @Patch('offer-categories/:id')
  @Roles(UserRole.OWNER)
  updateOffer(@Param('id') id: string, @Body() dto: UpdateOfferCategoryDto) {
    return this.configService.updateOfferCategory(id, dto);
  }

  @Delete('offer-categories/:id')
  @Roles(UserRole.OWNER)
  deleteOffer(@Param('id') id: string) {
    return this.configService.deleteOfferCategory(id);
  }
}
