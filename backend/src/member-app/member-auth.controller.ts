import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/roles.decorator';
import { FirebaseLoginDto, MemberRefreshDto } from './dto/member-app.dto';
import { MemberAppService } from './member-app.service';

@ApiTags('member-app')
@Public()
@Controller('member-app/auth')
export class MemberAuthController {
  constructor(private readonly members: MemberAppService) {}

  @Post('firebase')
  login(@Body() dto: FirebaseLoginDto) {
    return this.members.loginWithFirebase(dto.idToken);
  }

  @Post('refresh')
  refresh(@Body() dto: MemberRefreshDto) {
    return this.members.refresh(dto.refreshToken);
  }
}
