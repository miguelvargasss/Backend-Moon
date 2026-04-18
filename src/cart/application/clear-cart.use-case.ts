import { Injectable, Inject } from '@nestjs/common';
import type { ICartRepository } from '../domain/cart.repository.interface.js';
import { CART_REPOSITORY } from '../domain/cart.repository.interface.js';

@Injectable()
export class ClearCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    return this.cartRepository.clearCart(userId);
  }
}
