import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface.js';
import { USER_REPOSITORY } from '../domain/user.repository.interface.js';
import { User } from '../domain/user.entity.js';

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, data: Partial<Pick<User, 'name' | 'lastName'>>) {
    return this.userRepository.update(userId, data);
  }
}
