import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner@gym.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Owner@123' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'owner@gym.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsString()
  phone?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
