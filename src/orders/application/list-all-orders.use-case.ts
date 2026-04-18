import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../domain/order.repository.interface.js';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface.js';

/**
 * CU08 — Admin ve todos los pedidos ordenados por fecha.
 */
@Injectable()
export class ListAllOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute() {
    return this.orderRepository.findAll();
  }
}
