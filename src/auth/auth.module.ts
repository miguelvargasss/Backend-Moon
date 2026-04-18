import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { LoginUseCase } from './application/login.use-case.js';
import { RegisterUseCase } from './application/register.use-case.js';
import { LogoutUseCase } from './application/logout.use-case.js';
import { RefreshSessionUseCase } from './application/refresh-session.use-case.js';
import { SupabaseAuthRepository } from './infrastructure/supabase-auth.repository.js';
import { AUTH_REPOSITORY } from './domain/auth.repository.interface.js';

@Module({
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    LogoutUseCase,
    RefreshSessionUseCase,
    { provide: AUTH_REPOSITORY, useClass: SupabaseAuthRepository },
  ],
})
export class AuthModule {}
