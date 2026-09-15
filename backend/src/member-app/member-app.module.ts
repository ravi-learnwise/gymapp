import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FirebaseAdminService } from './firebase-admin.service';
import { MemberAppController } from './member-app.controller';
import { MemberAppService } from './member-app.service';
import { MemberAuthController } from './member-auth.controller';
import { MemberAuthGuard } from './member-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MemberAuthController, MemberAppController],
  providers: [MemberAppService, FirebaseAdminService, MemberAuthGuard],
})
export class MemberAppModule {}
