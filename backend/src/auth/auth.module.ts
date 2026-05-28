import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from './jwt.service';
import { UsersService } from './users.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [UsersService, JwtTokenService, JwtAuthGuard],
  exports: [UsersService, JwtTokenService, JwtAuthGuard],
})
export class AuthModule {}
