import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../domain/auth.repository.interface.js';
import { AUTH_REPOSITORY } from '../domain/auth.repository.interface.js';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(email: string, password: string, metadata: { Name: string; LastName: string }) {
    return this.authRepository.register(email, password, metadata);
  }
}
