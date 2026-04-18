import { Injectable, Inject } from '@nestjs/common';
import type { IShippingRepository } from '../domain/shipping.repository.interface.js';
import { SHIPPING_REPOSITORY } from '../domain/shipping.repository.interface.js';
import { ShippingAddress } from '../domain/shipping-address.entity.js';

@Injectable()
export class AddShippingAddressUseCase {
  constructor(
    @Inject(SHIPPING_REPOSITORY)
    private readonly shippingRepository: IShippingRepository,
  ) {}

  async execute(data: Omit<ShippingAddress, 'id'>) {
    return this.shippingRepository.create(data);
  }
}
