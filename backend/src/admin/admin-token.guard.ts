import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/// Cheap shared-secret guard for the admin surface.
///
/// The token is compared against the ADMIN_TOKEN env var. If ADMIN_TOKEN is
/// missing or empty the guard refuses every request — production must set it.
@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_TOKEN');
    if (!expected || expected.length < 8) {
      throw new UnauthorizedException(
        'Admin surface is disabled (ADMIN_TOKEN not configured)',
      );
    }
    const req = ctx.switchToHttp().getRequest<Request>();
    const got =
      (req.headers['x-admin-token'] as string | undefined) ??
      this.bearer(req.headers.authorization);

    if (got !== expected) {
      throw new UnauthorizedException('Invalid admin token');
    }
    return true;
  }

  private bearer(h: string | undefined): string | undefined {
    if (!h) return undefined;
    const [scheme, value] = h.split(' ');
    return scheme?.toLowerCase() === 'bearer' ? value : undefined;
  }
}
