import { IsString, MinLength } from 'class-validator';

export class FirebaseLoginDto {
  @IsString()
  @MinLength(10)
  idToken!: string;
}

export class MemberRefreshDto {
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
