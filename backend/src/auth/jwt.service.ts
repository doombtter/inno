import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from './types';

const DEFAULT_TTL = '7d';

@Injectable()
export class JwtTokenService {
  private readonly secret: string;
  private readonly ttl: string;

  constructor(config: ConfigService) {
    const s = config.get<string>('JWT_SECRET');
    if (!s || s.length < 16) {
      throw new Error(
        'JWT_SECRET must be set to at least 16 characters in the env',
      );
    }
    this.secret = s;
    this.ttl = config.get<string>('JWT_TTL') ?? DEFAULT_TTL;
  }

  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.ttl,
      algorithm: 'HS256',
    } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as JwtPayload;
  }
}
