import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MemberAuthUser } from './member-auth.types';

export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MemberAuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
