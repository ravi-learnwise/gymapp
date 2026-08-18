import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExerciseDto,
  ExerciseQueryDto,
  UpdateExerciseDto,
} from './dto/exercise.dto';

@Injectable()
export class ExerciseService {
  constructor(private prisma: PrismaService) {}

  findAll(query: ExerciseQueryDto) {
    const where: Prisma.ExerciseWhereInput = {};
    if (query.activeOnly !== false) where.isActive = true;
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s } },
        { muscleGroups: { contains: s } },
        { equipment: { contains: s } },
      ];
    }
    return this.prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  create(dto: CreateExerciseDto, userId: string) {
    return this.prisma.exercise.create({
      data: { ...dto, createdById: userId },
    });
  }

  async update(id: string, dto: UpdateExerciseDto) {
    await this.findOne(id);
    return this.prisma.exercise.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.exercise.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
