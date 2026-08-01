import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async getGymConfig() {
    let config = await this.prisma.gymConfig.findFirst();
    if (!config) {
      config = await this.prisma.gymConfig.create({ data: { name: 'My Gym' } });
    }
    return config;
  }

  async updateGymConfig(dto: UpdateGymConfigDto) {
    const config = await this.getGymConfig();
    return this.prisma.gymConfig.update({ where: { id: config.id }, data: dto });
  }

  getPrograms() {
    return this.prisma.program.findMany({
      include: { durations: { orderBy: { months: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  createProgram(dto: CreateProgramDto) {
    return this.prisma.program.create({ data: dto });
  }

  async updateProgram(id: string, dto: UpdateProgramDto) {
    await this.ensureProgram(id);
    return this.prisma.program.update({ where: { id }, data: dto });
  }

  async deleteProgram(id: string) {
    await this.ensureProgram(id);
    await this.prisma.program.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Program deactivated' };
  }

  async addDuration(programId: string, dto: CreateDurationDto) {
    await this.ensureProgram(programId);
    return this.prisma.programDuration.create({
      data: { programId, ...dto, price: dto.price },
    });
  }

  async updateDuration(id: string, dto: UpdateDurationDto) {
    await this.ensureDuration(id);
    return this.prisma.programDuration.update({ where: { id }, data: dto });
  }

  async deleteDuration(id: string) {
    await this.ensureDuration(id);
    await this.prisma.programDuration.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Duration deactivated' };
  }

  getDiscountCategories() {
    return this.prisma.discountCategory.findMany({ orderBy: { name: 'asc' } });
  }

  createDiscountCategory(dto: CreateDiscountCategoryDto) {
    return this.prisma.discountCategory.create({ data: dto });
  }

  async updateDiscountCategory(id: string, dto: UpdateDiscountCategoryDto) {
    await this.ensureDiscount(id);
    return this.prisma.discountCategory.update({ where: { id }, data: dto });
  }

  async deleteDiscountCategory(id: string) {
    await this.ensureDiscount(id);
    await this.prisma.discountCategory.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Discount category deactivated' };
  }

  getOfferCategories() {
    return this.prisma.offerCategory.findMany({ orderBy: { name: 'asc' } });
  }

  createOfferCategory(dto: CreateOfferCategoryDto) {
    return this.prisma.offerCategory.create({ data: dto });
  }

  async updateOfferCategory(id: string, dto: UpdateOfferCategoryDto) {
    await this.ensureOffer(id);
    return this.prisma.offerCategory.update({ where: { id }, data: dto });
  }

  async deleteOfferCategory(id: string) {
    await this.ensureOffer(id);
    await this.prisma.offerCategory.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Offer category deactivated' };
  }

  private async ensureProgram(id: string) {
    const p = await this.prisma.program.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Program not found');
  }

  private async ensureDuration(id: string) {
    const d = await this.prisma.programDuration.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Duration not found');
  }

  private async ensureDiscount(id: string) {
    const d = await this.prisma.discountCategory.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Discount category not found');
  }

  private async ensureOffer(id: string) {
    const o = await this.prisma.offerCategory.findUnique({ where: { id } });
    if (!o) throw new NotFoundException('Offer category not found');
  }
}
