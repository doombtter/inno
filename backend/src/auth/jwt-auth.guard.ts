import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtTokenService } from './jwt.service';
import type { JwtPayload, Role } from './types';

export const ROLES_KEY = 'roles';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtTokenService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = this.extract(req);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    req.user = payload;

    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (required && required.length > 0 && !required.includes(payload.role)) {
      throw new ForbiddenException(
        `Requires role: ${required.join(' or ')}`,
      );
    }
    return true;
  }

  private extract(req: Request): string | undefined {
    const h = req.headers.authorization;
    if (h) {
      const [scheme, value] = h.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && value) return value;
    }
    const hx = req.headers['x-admin-token'];
    return typeof hx === 'string' ? hx : undefined;
  }
}
