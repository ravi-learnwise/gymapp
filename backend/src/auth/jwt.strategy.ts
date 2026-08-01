import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthUser } from '../common/decorators/current-user.decorator';

type JwtPayload = {
  sub: string;
  email: string;
  role: AuthUser['role'];
  type: 'access' | 'refresh';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
