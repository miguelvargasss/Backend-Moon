import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface.js';
import { USER_REPOSITORY } from '../domain/user.repository.interface.js';

@Injectable()
export class ListAllUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute() {
    return this.userRepository.findAll();
  }
}
