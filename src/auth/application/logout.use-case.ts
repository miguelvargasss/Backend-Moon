import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../domain/auth.repository.interface.js';
import { AUTH_REPOSITORY } from '../domain/auth.repository.interface.js';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(accessToken: string): Promise<void> {
    return this.authRepository.logout(accessToken);
  }
}
