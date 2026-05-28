import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { ROLES_KEY } from './jwt-auth.guard';
import type { JwtPayload, Role } from './types';

/// @Roles('admin') on a handler/class restricts it to admins.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/// @CurrentUser() injects the verified JWT payload.
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as JwtPayload;
  },
);
