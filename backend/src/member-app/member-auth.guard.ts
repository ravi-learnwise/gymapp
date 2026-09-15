import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MemberAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization as string | undefined;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = this.jwt.verify(header.slice(7), {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.type !== 'member_access') {
        throw new UnauthorizedException('Invalid token type');
      }
      req.user = {
        id: payload.sub as string,
        email: (payload.email as string) ?? null,
        type: 'member_access',
      };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
