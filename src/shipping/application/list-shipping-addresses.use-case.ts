import { Injectable, Inject } from '@nestjs/common';
import type { IShippingRepository } from '../domain/shipping.repository.interface.js';
import { SHIPPING_REPOSITORY } from '../domain/shipping.repository.interface.js';

@Injectable()
export class ListShippingAddressesUseCase {
  constructor(
    @Inject(SHIPPING_REPOSITORY)
    private readonly shippingRepository: IShippingRepository,
  ) {}

  async execute(userId: string) {
    return this.shippingRepository.findByUserId(userId);
  }
}
