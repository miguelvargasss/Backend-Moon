import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../domain/auth.repository.interface.js';
import { AUTH_REPOSITORY } from '../domain/auth.repository.interface.js';

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(refreshToken: string) {
    return this.authRepository.refreshSession(refreshToken);
  }
}
