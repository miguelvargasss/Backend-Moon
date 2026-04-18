import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { GetUserProfileUseCase } from './application/get-user-profile.use-case.js';
import { UpdateUserProfileUseCase } from './application/update-user-profile.use-case.js';
import { SupabaseUserRepository } from './infrastructure/supabase-user.repository.js';
import { USER_REPOSITORY } from './domain/user.repository.interface.js';

@Module({
  controllers: [UsersController],
  providers: [
    GetUserProfileUseCase,
    UpdateUserProfileUseCase,
    { provide: USER_REPOSITORY, useClass: SupabaseUserRepository },
  ],
  exports: [GetUserProfileUseCase],
})
export class UsersModule {}
