import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface.js';
import { USER_REPOSITORY } from '../domain/user.repository.interface.js';

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string) {
    return this.userRepository.findById(userId);
  }
}
