import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ExerciseService } from './exercise.service';
import {
  CreateExerciseDto,
  ExerciseQueryDto,
  UpdateExerciseDto,
} from './dto/exercise.dto';

const uploadDir = join(process.cwd(), 'uploads', 'exercises');
mkdirSync(uploadDir, { recursive: true });

@ApiTags('exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExerciseController {
  constructor(private exerciseService: ExerciseService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findAll(@Query() query: ExerciseQueryDto) {
    return this.exerciseService.findAll(query);
  }

  @Post('upload-image')
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
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.png';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Image file is required');
    return { imageUrl: `/api/media/exercises/${file.filename}` };
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TRAINER)
  findOne(@Param('id') id: string) {
    return this.exerciseService.findOne(id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() dto: CreateExerciseDto, @CurrentUser() user: AuthUser) {
    return this.exerciseService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  deactivate(@Param('id') id: string) {
    return this.exerciseService.deactivate(id);
  }
}
