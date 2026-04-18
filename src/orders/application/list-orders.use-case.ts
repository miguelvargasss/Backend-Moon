import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../domain/order.repository.interface.js';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface.js';

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }
}
