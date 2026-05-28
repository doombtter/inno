import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { JwtTokenService } from './jwt.service';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators';
import type { JwtPayload, UserRecord } from './types';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

@Controller('admin/auth')
export class AuthController {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtTokenService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ token: string; user: UserRecord }> {
    const user = await this.users.verifyPassword(dto.email, dto.password);
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    return { token, user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: JwtPayload): Promise<UserRecord> {
    // Hit the DB so disabled/deleted accounts don't keep working until token TTL.
    const fresh = await this.users.findById(user.sub);
    if (!fresh) {
      // findById returns null → behave like 401
      throw new Error('User not found');
    }
    return fresh;
  }
}
