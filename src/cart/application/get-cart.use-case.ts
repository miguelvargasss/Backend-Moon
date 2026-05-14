import { Injectable, Inject } from '@nestjs/common';
import type { ICartRepository } from '../domain/cart.repository.interface.js';
import { CART_REPOSITORY } from '../domain/cart.repository.interface.js';

@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
  ) {}

  async execute(userId: string) {
    return this.cartRepository.findByUserId(userId);
  }
}
